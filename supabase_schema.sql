-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users Table (inherits from auth.users via trigger)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  full_name text,
  roll_number text,
  year integer,
  branch text,
  phone text,
  role text default 'student' check (role in ('student', 'admin')),
  wallet_balance numeric(10,2) default 0.00 check (wallet_balance >= 0),
  onboarding_completed boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS for users
alter table public.users enable row level security;

-- 2. Menu Items Table
create table public.menu_items (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  image_url text,
  category text not null,
  price numeric(10,2) not null check (price >= 0),
  rating numeric(2,1) default 5.0,
  prep_time text default '15 min',
  is_veg boolean default true,
  is_special boolean default false,
  available boolean default true,
  created_at timestamp with time zone default now()
);

-- Enable RLS for menu_items
alter table public.menu_items enable row level security;

-- 3. Orders Table
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  booking_id text unique not null,
  user_id uuid references public.users(id) on delete cascade not null,
  total_amount numeric(10,2) not null check (total_amount >= 0),
  payment_method text not null check (payment_method in ('upi', 'wallet', 'cod')),
  payment_status text not null check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  order_status text not null default 'Pending' check (order_status in ('Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled')),
  qr_code text,
  preparation_time integer default 15, -- minutes
  pickup_deadline timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS for orders
alter table public.orders enable row level security;

-- 4. Order Items Table
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  menu_item_id uuid references public.menu_items(id) on delete restrict not null,
  quantity integer not null check (quantity > 0),
  price numeric(10,2) not null check (price >= 0)
);

-- Enable RLS for order_items
alter table public.order_items enable row level security;

-- 5. Wallet Transactions Table
create table public.wallet_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('credit', 'debit')),
  amount numeric(10,2) not null check (amount > 0),
  description text,
  created_at timestamp with time zone default now()
);

-- Enable RLS for wallet_transactions
alter table public.wallet_transactions enable row level security;

-- 6. Payment Settings Table (Global admin config for UPI)
create table public.payment_settings (
  id uuid default gen_random_uuid() primary key,
  upi_id text not null,
  merchant_name text not null,
  updated_at timestamp with time zone default now()
);

-- Enable RLS for payment_settings
alter table public.payment_settings enable row level security;

-- 7. Notifications Table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS for notifications
alter table public.notifications enable row level security;

---------------------
-- DATABASE TRIGGERS & FUNCTIONS
---------------------

-- Trigger: Insert user profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, role, wallet_balance, onboarding_completed)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'student',
    0.00,
    false
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger: Automatically adjust wallet balance when a transaction is added
create or replace function public.handle_wallet_transaction()
returns trigger as $$
begin
  if new.type = 'credit' then
    update public.users
    set wallet_balance = wallet_balance + new.amount
    where id = new.user_id;
  elsif new.type = 'debit' then
    update public.users
    set wallet_balance = wallet_balance - new.amount
    where id = new.user_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_wallet_transaction_created
  after insert on public.wallet_transactions
  for each row execute function public.handle_wallet_transaction();

---------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
---------------------

-- Users Policies
create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Admins can view and edit all users" on public.users for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Menu Items Policies
create policy "Anyone can read menu items" on public.menu_items for select using (true);
create policy "Only admins can modify menu items" on public.menu_items for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Orders Policies
create policy "Users can read own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Users can update own orders (cancel only)" on public.orders for update using (auth.uid() = user_id);
create policy "Admins can view and manage all orders" on public.orders for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Order Items Policies
create policy "Users can read own order items" on public.order_items for select using (
  exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
);
create policy "Users can insert own order items" on public.order_items for insert with check (
  exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
);
create policy "Admins can view all order items" on public.order_items for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Wallet Transactions Policies
create policy "Users can view own transactions" on public.wallet_transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions (deposits/charges)" on public.wallet_transactions for insert with check (auth.uid() = user_id);
create policy "Admins can view and manage all transactions" on public.wallet_transactions for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- Notifications Policies
create policy "Users can manage own notifications" on public.notifications for all using (auth.uid() = user_id);

---------------------
-- SEED DATA
---------------------
-- Seed default payment settings
insert into public.payment_settings (upi_id, merchant_name) 
values ('canteen@upi', 'Campus Canteen')
on conflict do nothing;

-- Seed default menu items
insert into public.menu_items (name, description, category, price, rating, prep_time, is_veg, is_special, available)
values 
('Butter Chicken', 'Creamy tomato-based curry with tender chicken', 'lunch', 180.00, 4.9, '20 min', false, false, true),
('Paneer Tikka Masala', 'Grilled paneer in rich spiced gravy', 'lunch', 150.00, 4.8, '15 min', true, true, true),
('Veg Biryani', 'Aromatic basmati rice with mixed vegetables', 'lunch', 120.00, 4.7, '18 min', true, false, true),
('Chicken Fried Rice', 'Wok-tossed rice with chicken and veggies', 'lunch', 130.00, 4.6, '12 min', false, false, true),
('Masala Dosa', 'Crispy dosa with spiced potato filling', 'breakfast', 60.00, 4.8, '10 min', true, true, true),
('Idli Sambar', 'Steamed rice cakes with lentil soup', 'breakfast', 40.00, 4.5, '8 min', true, false, true),
('Samosa', 'Crispy pastry with spiced potato filling', 'snacks', 25.00, 4.4, '5 min', true, false, true),
('French Fries', 'Crispy golden fries with seasoning', 'snacks', 70.00, 4.3, '8 min', true, false, true),
('Cold Coffee', 'Chilled coffee with ice cream', 'beverages', 60.00, 4.6, '5 min', true, true, true),
('Mango Lassi', 'Refreshing mango yogurt drink', 'beverages', 50.00, 4.7, '5 min', true, false, true),
('Gulab Jamun', 'Sweet milk dumplings in sugar syrup', 'desserts', 40.00, 4.8, '5 min', true, true, true),
('Ice Cream Sundae', 'Vanilla ice cream with chocolate sauce', 'desserts', 80.00, 4.5, '5 min', true, false, true);
