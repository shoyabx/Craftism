-- Create Profiles Table (Public Profile Data)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Create Resumes Table
create table public.resumes (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    title text, -- e.g. "Software Engineer Resume"
    content jsonb, -- structured data for the resume
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.resumes enable row level security;
create policy "Users can CRUD own resumes" on public.resumes for all using (auth.uid() = user_id);

-- Create Presentations Table
create table public.presentations (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    title text,
    slides_data jsonb, -- array of slide content
    theme text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.presentations enable row level security;
create policy "Users can CRUD own presentations" on public.presentations for all using (auth.uid() = user_id);

-- Create Writings Table
create table public.writings (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    title text,
    content text,
    refined_content text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.writings enable row level security;
create policy "Users can CRUD own writings" on public.writings for all using (auth.uid() = user_id);

-- Create Scripts/Challenges Table (Progress tracking)
create table public.user_challenges (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) not null,
    challenge_id text, -- ID of the challenge from static list
    status text, -- 'completed', 'in-progress'
    solution text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.user_challenges enable row level security;
create policy "Users can CRUD own challenges" on public.user_challenges for all using (auth.uid() = user_id);
