--
-- PostgreSQL database dump
--

\restrict kmgVKOFBPiP6t71y6zThU3VZ4NHnGVrmhkxMBvmeQGKpv4u9Sts4V1RgarM46S9

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.trial_sessions DROP CONSTRAINT IF EXISTS trial_sessions_jo_id_foreign;
ALTER TABLE IF EXISTS ONLY public.trial_findings DROP CONSTRAINT IF EXISTS trial_findings_trial_session_id_foreign;
ALTER TABLE IF EXISTS ONLY public.trial_entry_photos DROP CONSTRAINT IF EXISTS trial_entry_photos_trial_entry_id_foreign;
ALTER TABLE IF EXISTS ONLY public.trial_entries DROP CONSTRAINT IF EXISTS trial_entries_trial_finding_id_foreign;
ALTER TABLE IF EXISTS ONLY public.process_photos DROP CONSTRAINT IF EXISTS process_photos_control_id_foreign;
ALTER TABLE IF EXISTS ONLY public.po_trackings DROP CONSTRAINT IF EXISTS po_trackings_control_id_foreign;
ALTER TABLE IF EXISTS ONLY public.jos DROP CONSTRAINT IF EXISTS jos_project_id_foreign;
ALTER TABLE IF EXISTS ONLY public.items DROP CONSTRAINT IF EXISTS items_category_id_foreign;
ALTER TABLE IF EXISTS ONLY public.controls DROP CONSTRAINT IF EXISTS controls_item_id_foreign;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_jo_id_foreign;
ALTER TABLE IF EXISTS ONLY public.activities DROP CONSTRAINT IF EXISTS activities_jo_id_foreign;
DROP INDEX IF EXISTS public.users_username_index;
DROP INDEX IF EXISTS public.users_role_index;
DROP INDEX IF EXISTS public.trial_sessions_trial_date_index;
DROP INDEX IF EXISTS public.trial_sessions_job_no_index;
DROP INDEX IF EXISTS public.trial_sessions_jo_id_index;
DROP INDEX IF EXISTS public.trial_findings_trial_session_id_index;
DROP INDEX IF EXISTS public.trial_findings_order_index;
DROP INDEX IF EXISTS public.trial_entry_photos_trial_entry_id_index;
DROP INDEX IF EXISTS public.trial_entries_trial_finding_id_index;
DROP INDEX IF EXISTS public.trial_entries_status_index;
DROP INDEX IF EXISTS public.trial_entries_section_index;
DROP INDEX IF EXISTS public.trial_entries_order_index;
DROP INDEX IF EXISTS public.sessions_user_id_index;
DROP INDEX IF EXISTS public.sessions_last_activity_index;
DROP INDEX IF EXISTS public.projects_name_index;
DROP INDEX IF EXISTS public.projects_customer_index;
DROP INDEX IF EXISTS public.projects_company_index;
DROP INDEX IF EXISTS public.process_photos_control_id_index;
DROP INDEX IF EXISTS public.po_trackings_target_arrival_index;
DROP INDEX IF EXISTS public.po_trackings_supplier_index;
DROP INDEX IF EXISTS public.po_trackings_po_no_index;
DROP INDEX IF EXISTS public.personal_access_tokens_tokenable_type_tokenable_id_index;
DROP INDEX IF EXISTS public.personal_access_tokens_expires_at_index;
DROP INDEX IF EXISTS public.jos_type_index;
DROP INDEX IF EXISTS public.jos_project_id_index;
DROP INDEX IF EXISTS public.jos_product_index;
DROP INDEX IF EXISTS public.jos_finish_date_index;
DROP INDEX IF EXISTS public.jobs_queue_index;
DROP INDEX IF EXISTS public.items_subcont_supplier_index;
DROP INDEX IF EXISTS public.items_subcont_status_index;
DROP INDEX IF EXISTS public.items_no_index;
DROP INDEX IF EXISTS public.items_is_subcont_index;
DROP INDEX IF EXISTS public.items_description_index;
DROP INDEX IF EXISTS public.items_category_id_index;
DROP INDEX IF EXISTS public.items_arrival_target_date_index;
DROP INDEX IF EXISTS public.failed_jobs_connection_queue_failed_at_index;
DROP INDEX IF EXISTS public.controls_target_date_index;
DROP INDEX IF EXISTS public.controls_status_index;
DROP INDEX IF EXISTS public.controls_process_index;
DROP INDEX IF EXISTS public.controls_item_id_index;
DROP INDEX IF EXISTS public.categories_sort_order_index;
DROP INDEX IF EXISTS public.categories_kind_index;
DROP INDEX IF EXISTS public.categories_jo_id_index;
DROP INDEX IF EXISTS public.cache_locks_expiration_index;
DROP INDEX IF EXISTS public.cache_expiration_index;
DROP INDEX IF EXISTS public.activities_jo_id_index;
DROP INDEX IF EXISTS public.activities_created_at_index;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.trial_sessions DROP CONSTRAINT IF EXISTS trial_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.trial_findings DROP CONSTRAINT IF EXISTS trial_findings_pkey;
ALTER TABLE IF EXISTS ONLY public.trial_entry_photos DROP CONSTRAINT IF EXISTS trial_entry_photos_pkey;
ALTER TABLE IF EXISTS ONLY public.trial_entries DROP CONSTRAINT IF EXISTS trial_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_pkey;
ALTER TABLE IF EXISTS ONLY public.process_photos DROP CONSTRAINT IF EXISTS process_photos_pkey;
ALTER TABLE IF EXISTS ONLY public.po_trackings DROP CONSTRAINT IF EXISTS po_trackings_pkey;
ALTER TABLE IF EXISTS ONLY public.po_trackings DROP CONSTRAINT IF EXISTS po_trackings_control_id_unique;
ALTER TABLE IF EXISTS ONLY public.personal_access_tokens DROP CONSTRAINT IF EXISTS personal_access_tokens_token_unique;
ALTER TABLE IF EXISTS ONLY public.personal_access_tokens DROP CONSTRAINT IF EXISTS personal_access_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.migrations DROP CONSTRAINT IF EXISTS migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.jos DROP CONSTRAINT IF EXISTS jos_pkey;
ALTER TABLE IF EXISTS ONLY public.jos DROP CONSTRAINT IF EXISTS jos_jo_number_unique;
ALTER TABLE IF EXISTS ONLY public.jobs DROP CONSTRAINT IF EXISTS jobs_pkey;
ALTER TABLE IF EXISTS ONLY public.job_batches DROP CONSTRAINT IF EXISTS job_batches_pkey;
ALTER TABLE IF EXISTS ONLY public.items DROP CONSTRAINT IF EXISTS items_pkey;
ALTER TABLE IF EXISTS ONLY public.failed_jobs DROP CONSTRAINT IF EXISTS failed_jobs_uuid_unique;
ALTER TABLE IF EXISTS ONLY public.failed_jobs DROP CONSTRAINT IF EXISTS failed_jobs_pkey;
ALTER TABLE IF EXISTS ONLY public.controls DROP CONSTRAINT IF EXISTS controls_pkey;
ALTER TABLE IF EXISTS ONLY public.controls DROP CONSTRAINT IF EXISTS controls_item_id_process_unique;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.cache DROP CONSTRAINT IF EXISTS cache_pkey;
ALTER TABLE IF EXISTS ONLY public.cache_locks DROP CONSTRAINT IF EXISTS cache_locks_pkey;
ALTER TABLE IF EXISTS ONLY public.activities DROP CONSTRAINT IF EXISTS activities_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.personal_access_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.migrations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.jobs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.failed_jobs ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.trial_sessions;
DROP TABLE IF EXISTS public.trial_findings;
DROP TABLE IF EXISTS public.trial_entry_photos;
DROP TABLE IF EXISTS public.trial_entries;
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.projects;
DROP TABLE IF EXISTS public.process_photos;
DROP TABLE IF EXISTS public.po_trackings;
DROP SEQUENCE IF EXISTS public.personal_access_tokens_id_seq;
DROP TABLE IF EXISTS public.personal_access_tokens;
DROP TABLE IF EXISTS public.password_reset_tokens;
DROP SEQUENCE IF EXISTS public.migrations_id_seq;
DROP TABLE IF EXISTS public.migrations;
DROP TABLE IF EXISTS public.jos;
DROP SEQUENCE IF EXISTS public.jobs_id_seq;
DROP TABLE IF EXISTS public.jobs;
DROP TABLE IF EXISTS public.job_batches;
DROP TABLE IF EXISTS public.items;
DROP SEQUENCE IF EXISTS public.failed_jobs_id_seq;
DROP TABLE IF EXISTS public.failed_jobs;
DROP TABLE IF EXISTS public.controls;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.cache_locks;
DROP TABLE IF EXISTS public.cache;
DROP TABLE IF EXISTS public.activities;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id uuid NOT NULL,
    jo_id uuid NOT NULL,
    message text NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration bigint NOT NULL
);


--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration bigint NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid NOT NULL,
    jo_id uuid NOT NULL,
    label character varying(255) NOT NULL,
    kind character varying(255) NOT NULL,
    is_custom boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: controls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.controls (
    id uuid NOT NULL,
    item_id uuid NOT NULL,
    process character varying(255) NOT NULL,
    status character varying(255) DEFAULT '-'::character varying NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    in_progress_at timestamp(0) without time zone,
    target_date date,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection character varying(255) NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id uuid NOT NULL,
    category_id uuid NOT NULL,
    no character varying(255) DEFAULT '-'::character varying NOT NULL,
    description character varying(255) NOT NULL,
    dimension character varying(255) DEFAULT ''::character varying NOT NULL,
    material character varying(255) DEFAULT ''::character varying NOT NULL,
    qty integer DEFAULT 1 NOT NULL,
    hrc character varying(255) DEFAULT ''::character varying NOT NULL,
    is_subcont boolean DEFAULT false NOT NULL,
    subcont_notes text,
    subcont_supplier character varying(255),
    subcont_status character varying(255),
    subcont_process character varying(255),
    subcont_dispatch_date timestamp(0) without time zone,
    subcont_done_at timestamp(0) without time zone,
    arrival_target_date date,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: jos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jos (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    jo_number character varying(255) NOT NULL,
    product character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    target_date date,
    finish_date date,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name text NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: po_trackings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.po_trackings (
    id uuid NOT NULL,
    control_id uuid NOT NULL,
    supplier character varying(255),
    po_no character varying(255),
    po_date date,
    target_arrival date,
    notes text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: process_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.process_photos (
    id uuid NOT NULL,
    control_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    path character varying(255) NOT NULL,
    added_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    customer character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    company character varying(10) DEFAULT 'BMI'::character varying NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


--
-- Name: trial_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trial_entries (
    id uuid NOT NULL,
    trial_finding_id uuid NOT NULL,
    section character varying(255) NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    text text DEFAULT ''::text NOT NULL,
    target_date date,
    pic character varying(255),
    status character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: trial_entry_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trial_entry_photos (
    id uuid NOT NULL,
    trial_entry_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    path character varying(255) NOT NULL,
    added_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: trial_findings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trial_findings (
    id uuid NOT NULL,
    trial_session_id uuid NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: trial_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trial_sessions (
    id uuid NOT NULL,
    jo_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    trial_date date NOT NULL,
    update_date date NOT NULL,
    customer character varying(255) NOT NULL,
    job_no character varying(255) NOT NULL,
    pic_name character varying(255) NOT NULL,
    approved_by_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    published_snapshot jsonb,
    last_published_at timestamp(0) without time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    role character varying(255) DEFAULT 'controller'::character varying NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    username character varying(255)
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activities (id, jo_id, message, created_at, updated_at) FROM stdin;
01a0e738-3a3f-7303-b65a-baec9c767345	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE UPPR" [Material] status changed to Done.	2026-09-28 08:53:36	2026-09-28 08:53:36
01a0e738-62c3-7053-a979-17c49966b7be	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE UPPR" [Machining] status changed to Done.	2026-09-28 08:53:47	2026-09-28 08:53:47
01a0eb56-6d8e-71d7-89a5-ef75d36537f9	63372c05-6dae-41b3-a650-941e70f54f2e	JO 126.151 created with categories: PART DIES OP 10, PART DIES OP 20, COMPONENT DIES OP 10, COMPONENT DIES OP 20.	2026-09-29 04:05:05	2026-09-29 04:05:05
01a0ebb9-b84c-72e7-9c25-d510f71f18f7	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "INS DIE BLOCK 2" [Material] status changed to Done.	2026-09-29 05:53:32	2026-09-29 05:53:32
01a0ebba-0833-71dc-93eb-d46edfee977f	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "INS DIE BLOCK 2" [Machining] status changed to Done.	2026-09-29 05:53:52	2026-09-29 05:53:52
01a0ebbb-33a8-711c-b64d-dfb8a20f2792	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "MAKURA" [Grinding] status changed to Done.	2026-09-29 05:55:09	2026-09-29 05:55:09
01a0ebfe-13f3-710d-a684-41eb7287d975	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "PH1" [Machining] status changed to In Progress.	2026-09-29 07:08:12	2026-09-29 07:08:12
01a0ec01-ec31-7122-a8fb-1c52e80484f5	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "INS DIE BLOCK 1" [Hardening] status changed to Not Started.	2026-09-29 07:12:24	2026-09-29 07:12:24
01a0f03c-1c36-7282-9252-2ad433820fff	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE LWR" [Grinding] status changed to Done.	2026-09-30 02:54:26	2026-09-30 02:54:26
01a0f03e-2b6f-73d8-a9d1-f4981ffa3954	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BC DIE LWR" [Arrival] status changed to Done.	2026-09-30 02:56:41	2026-09-30 02:56:41
01a0f041-41d7-72c8-bed5-e68d64ea63b7	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOTTOM SHOE" [Material] status changed to Done.	2026-09-30 03:00:03	2026-09-30 03:00:03
01a0f055-e782-7045-8e6a-071e6f02ba5b	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "MAKURA" [Arrival] status changed to Done.	2026-09-30 03:22:36	2026-09-30 03:22:36
01a0f059-7d3e-736d-812f-206cde35df80	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Bulk status updated for 2 items (PO, Arrival) → Done.	2026-09-30 03:26:31	2026-09-30 03:26:31
01a0f06a-4d28-726c-aaf6-5c5efd4dfe4b	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Bulk status updated for 2 items (Arrival) → In Progress.	2026-09-30 03:44:53	2026-09-30 03:44:53
01a0f06d-b1fe-7299-a145-fa1456c7dd13	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOLT L" [Arrival] status changed to Done.	2026-09-30 03:48:35	2026-09-30 03:48:35
01a0f06d-e42d-7160-8911-84207022de32	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOLT L" [Arrival] status changed to Done.	2026-09-30 03:48:48	2026-09-30 03:48:48
01a0f06e-8fb2-7188-9429-e247bb0c262c	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "SPRING" [Arrival] status changed to -.	2026-09-30 03:49:32	2026-09-30 03:49:32
01a0f070-d511-7371-9c88-d257991da615	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOLT L" [PO] status changed to -.	2026-09-30 03:52:01	2026-09-30 03:52:01
01a0f070-fe3a-71ed-965b-80adfe242dd6	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOLT L" [Arrival] status changed to Done.	2026-09-30 03:52:12	2026-09-30 03:52:12
01a0f080-89da-70a3-8b1f-697f7a1e4b7c	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "MAKURA" [Machining] status changed to Done.	2026-09-30 04:09:10	2026-09-30 04:09:10
01a0f091-f3d0-7100-b616-4d0b1eb6f95f	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Photo "17907424527823597773834441782149.jpg" added to "DIE UPPR" [Grinding].	2026-09-30 04:28:12	2026-09-30 04:28:12
01a0f09b-3103-7146-8dd3-e586d0fd73c2	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "LOWER CLAMPING PLATE" [Arrival] status changed to Done.	2026-09-30 04:38:17	2026-09-30 04:38:17
01a0f09c-8594-7357-aab9-7bbca2922479	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOTTOM SHOE" [Machining] status changed to In Progress.	2026-09-30 04:39:44	2026-09-30 04:39:44
01a0f0a5-654c-73a6-83ae-2e86e373f569	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BC UPPR" [Machining] status changed to Done.	2026-09-30 04:49:26	2026-09-30 04:49:26
01a0f0f3-e3c6-7238-9fda-b1a5e5da95ee	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Bulk status updated for 7 items (PO, Arrival) → Done.	2026-09-30 06:15:10	2026-09-30 06:15:10
01a0f131-0310-719f-b904-8c57f1efc038	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Batch: 3 items added to PART JIG.	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f13b-6ca6-7172-887d-9bde2672b2aa	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Kirim PO: 1 items to Supplier.	2026-09-30 07:33:18	2026-09-30 07:33:18
01a0f13d-3916-73c7-bf6f-b055589b563c	63372c05-6dae-41b3-a650-941e70f54f2e	Batch: 15 items added to PART DIES OP 20.	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f164-5f4a-718a-91e9-7660a300a700	63372c05-6dae-41b3-a650-941e70f54f2e	Batch: 15 items added to PART DIES OP 20.	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f176-d42d-7250-af05-1bf5b1c81c9b	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BC UPPR" [Grinding] status changed to Not Started.	2026-09-30 08:38:11	2026-09-30 08:38:11
01a0e738-4092-73f8-966e-4e6f3be7f317	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE UPPR" [Arrival] status changed to Done.	2026-09-28 08:53:38	2026-09-28 08:53:38
01a0e738-6cdd-73fc-a93b-c748f0c9bb42	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE LWR" [Machining] status changed to Done.	2026-09-28 08:53:49	2026-09-28 08:53:49
01a0ebb9-3bb6-73ab-9485-e911cf7cdc3c	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "LOWER HOLDER" [Grinding] status changed to Done.	2026-09-29 05:53:00	2026-09-29 05:53:00
01a0ebb9-bf80-7108-a6a9-54d24b8e9275	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "INS DIE BLOCK 2" [Arrival] status changed to Done.	2026-09-29 05:53:34	2026-09-29 05:53:34
01a0ebba-3b9a-7397-a0f5-c4ce9addebec	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Bulk Subcont: 1 items sent to CHIYODA for Hardening.	2026-09-29 05:54:05	2026-09-29 05:54:05
01a0ebbb-4c42-727c-becc-14587dd061ed	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "LOWER CLAMPING" [Grinding] status changed to Done.	2026-09-29 05:55:15	2026-09-29 05:55:15
01a0ebfe-1c72-721d-b7c5-2200ec020eec	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "INS DIE BLOCK 2" [Hardening] status changed to In Progress.	2026-09-29 07:08:14	2026-09-29 07:08:14
01a0ec01-fa7d-7278-b2e6-e8ad7fea7335	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "LOWER HOLDER" [Machining] status changed to In Progress.	2026-09-29 07:12:27	2026-09-29 07:12:27
01a0f03d-bbef-72e4-8543-8f2dfc43e460	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Bulk Subcont: 1 items sent to PUTRA for Wirecut.	2026-09-30 02:56:12	2026-09-30 02:56:12
01a0f03e-3cbe-70ca-be85-2d4fa4131063	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BC DIE LWR" [Machining] status changed to Done.	2026-09-30 02:56:45	2026-09-30 02:56:45
01a0f041-4cf4-7115-8e65-3ed497a7a4ff	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOTTOM SHOE" [Arrival] status changed to Done.	2026-09-30 03:00:06	2026-09-30 03:00:06
01a0f058-412e-708c-b7b9-32baf9b83d45	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Bulk Target Arrival set to 2026-09-29 for 4 items.	2026-09-30 03:25:10	2026-09-30 03:25:10
01a0f067-1281-73dd-adf8-085367523f24	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Bulk status updated for 21 items (PO) → Done.	2026-09-30 03:41:21	2026-09-30 03:41:21
01a0f06d-06b2-7135-87b4-c28547978d00	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "SHOULDER PUNCH" [Arrival] status changed to In Progress.	2026-09-30 03:47:52	2026-09-30 03:47:52
01a0f06d-b900-726c-a562-c277002eeae3	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOLT L" [Arrival] status changed to Done.	2026-09-30 03:48:37	2026-09-30 03:48:37
01a0f06d-f11e-734b-9498-ee653a3631b8	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "PIN" [Arrival] status changed to Done.	2026-09-30 03:48:52	2026-09-30 03:48:52
01a0f070-71cd-70e8-9859-69624efdfda2	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Bulk status updated for 8 items (Arrival, PO) → Done.	2026-09-30 03:51:36	2026-09-30 03:51:36
01a0f070-e5e7-70e5-a4d7-fb9ba1313661	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOLT L" [PO] status changed to Done.	2026-09-30 03:52:05	2026-09-30 03:52:05
01a0f071-070b-70a8-b414-c5a5a5188f1d	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOLT L" [Arrival] status changed to Done.	2026-09-30 03:52:14	2026-09-30 03:52:14
01a0f085-2b96-70c9-b128-cb365b952e76	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "PAD" [Machining] status changed to Done.	2026-09-30 04:14:14	2026-09-30 04:14:14
01a0f09a-f5bc-73e6-905e-24a4f2b728a8	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "TOP SHOE" [Material] status changed to Done.	2026-09-30 04:38:02	2026-09-30 04:38:02
01a0f09b-bc55-7215-8afc-54a4806b4254	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "LOWER CLAMPING PLATE" [Machining] status changed to Done.	2026-09-30 04:38:53	2026-09-30 04:38:53
01a0f09e-52bf-70ae-9307-63d1f8ec54cc	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "TOP SHOE" [Machining] status changed to Not Started.	2026-09-30 04:41:42	2026-09-30 04:41:42
01a0f0a6-689b-707c-abf6-be9a963f439e	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE 1" [Machining] status changed to Done.	2026-09-30 04:50:32	2026-09-30 04:50:32
01a0f12b-9904-7187-a249-a881f6b67e2c	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Category "PART JIG" added.	2026-09-30 07:16:01	2026-09-30 07:16:01
01a0f133-d543-7278-926c-bbd5caf9e407	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Kirim PO: 1 items to PT Precision Special Steel (PO: 1286).	2026-09-30 07:25:01	2026-09-30 07:25:01
01a0f13b-74a8-71e0-aaba-5ea1207fa2cc	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOLT L" [PO] status changed to -.	2026-09-30 07:33:20	2026-09-30 07:33:20
01a0f13e-1a77-73cc-8ec1-6490db490e20	63372c05-6dae-41b3-a650-941e70f54f2e	Batch: 8 items added to COMPONENT DIES OP 20.	2026-09-30 07:36:14	2026-09-30 07:36:14
01a0f164-fda1-7114-ab6e-84cc124aaef3	63372c05-6dae-41b3-a650-941e70f54f2e	Batch: 8 items deleted.	2026-09-30 08:18:42	2026-09-30 08:18:42
01a0f532-4f89-7175-96b4-7a63fb10d84b	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "PAD" [Grinding] status changed to Done.	2026-10-01 02:01:50	2026-10-01 02:01:50
01a0e738-48ef-7346-b3a8-7069a420493a	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE LWR" [Material] status changed to Done.	2026-09-28 08:53:40	2026-09-28 08:53:40
01a0e738-823c-72a7-be42-5b956b8b81b0	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE UPPR" [Hardening] status changed to In Progress.	2026-09-28 08:53:55	2026-09-28 08:53:55
01a0ebb9-4d1d-7310-952a-1eeded201561	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "LOWER HOLDER" [Machining] status changed to Not Started.	2026-09-29 05:53:04	2026-09-29 05:53:04
01a0ebb9-f41b-7283-ac54-fcdda4c7863d	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "INS DIE BLOCK 2" [Machining] status changed to In Progress.	2026-09-29 05:53:47	2026-09-29 05:53:47
01a0ebba-bf30-7162-a65e-b589444334cd	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "TOP SHOE" [Grinding] status changed to Done.	2026-09-29 05:54:39	2026-09-29 05:54:39
01a0ebfe-0276-7136-9bf2-e0504fa09c43	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BC STRIPPER 1" [Machining] status changed to In Progress.	2026-09-29 07:08:07	2026-09-29 07:08:07
01a0ebfe-1eab-7004-a593-0f612f54ffa5	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BC PH 1" [Machining] status changed to In Progress.	2026-09-29 07:08:14	2026-09-29 07:08:14
01a0ec02-2d44-7108-8403-ea0fcfbc7bbd	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BACKING DIE 1" [Machining] status changed to In Progress.	2026-09-29 07:12:40	2026-09-29 07:12:40
01a0f03d-d0ac-7058-906b-d587688b2083	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE UPPR" [Hardening] status changed to Done.	2026-09-30 02:56:18	2026-09-30 02:56:18
01a0f03e-f063-718c-ac54-9a4bdcbec8d9	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Bulk Subcont: 1 items sent to KANETSU for Hardening.	2026-09-30 02:57:31	2026-09-30 02:57:31
01a0f041-5eee-701e-8303-9f8b28ac41d8	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOTTOM SHOE" [Machining] status changed to In Progress.	2026-09-30 03:00:11	2026-09-30 03:00:11
01a0f058-438f-7159-bc58-95ee4f6a759d	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Bulk status updated for 4 items (PO, Arrival) → Done.	2026-09-30 03:25:11	2026-09-30 03:25:11
01a0f067-1460-708a-a9a9-0a9c40dc4602	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Bulk Target Arrival set to 2026-09-29 for 21 items.	2026-09-30 03:41:22	2026-09-30 03:41:22
01a0f06d-7a1b-73fe-a9f8-a1a6573caa31	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Bulk Target Arrival set to 2026-10-08 for 1 items.	2026-09-30 03:48:21	2026-09-30 03:48:21
01a0f06d-c7ba-7025-b33b-28a902bc61eb	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOLT L" [Arrival] status changed to Done.	2026-09-30 03:48:41	2026-09-30 03:48:41
01a0f06e-0d09-73e3-b9bf-99d264d4a792	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "PIN" [Arrival] status changed to Done.	2026-09-30 03:48:59	2026-09-30 03:48:59
01a0f070-748c-7065-9254-b1aab587c290	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Bulk Target Arrival set to 2026-09-29 for 8 items.	2026-09-30 03:51:36	2026-09-30 03:51:36
01a0f070-eff0-7170-8cab-87e398e26a09	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOLT L" [PO] status changed to Done.	2026-09-30 03:52:08	2026-09-30 03:52:08
01a0f071-0e98-7087-b8c0-7b69e5908721	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOLT L" [Arrival] status changed to Done.	2026-09-30 03:52:16	2026-09-30 03:52:16
01a0f085-49a3-7066-ac10-d7431bf04574	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BACKING DIE 1" [Machining] status changed to Done.	2026-09-30 04:14:22	2026-09-30 04:14:22
01a0f09a-fbeb-7026-9c6f-8f862311d90b	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "TOP SHOE" [Arrival] status changed to Done.	2026-09-30 04:38:04	2026-09-30 04:38:04
01a0f09c-7330-7148-b7c7-bef1c7859136	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOTTOM SHOE" [Machining] status changed to Not Started.	2026-09-30 04:39:40	2026-09-30 04:39:40
01a0f09e-7b2c-7308-a015-3cbe9e05ca5c	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Photo "17907432849965650078385771389907.jpg" added to "TOP SHOE" [Machining].	2026-09-30 04:41:53	2026-09-30 04:41:53
01a0f0a6-9627-7265-8c5f-4764bda2511c	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "LOWER HOLDER" [Machining] status changed to Done.	2026-09-30 04:50:44	2026-09-30 04:50:44
01a0f12c-ae98-72d2-b5e5-a2aaba3e721c	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Category "MATERIAL JIG KERATAAN" added.	2026-09-30 07:17:12	2026-09-30 07:17:12
01a0f133-f024-7163-b6ce-dd94bfdebc5f	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Kirim PO: 1 items to PT Precision Special Steel (PO: 1286).	2026-09-30 07:25:08	2026-09-30 07:25:08
01a0f13b-83a3-7088-ab93-f594fad2f875	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOLT L" [PO] status changed to Not Started.	2026-09-30 07:33:24	2026-09-30 07:33:24
01a0f140-68b4-7134-8337-c38c002f3a29	b62005c8-a3fd-483f-b68e-6dc3ef2255a8	JO 126.153 created with categories: PART DIES OP 10, PART DIES OP 20, PART DIES OP 30, COMPONENT DIES OP 10, COMPONENT DIES OP 20, COMPONENT DIES OP 30.	2026-09-30 07:38:45	2026-09-30 07:38:45
01a0f165-8062-71be-9ab6-d0fe4e73ee6a	63372c05-6dae-41b3-a650-941e70f54f2e	Batch: 8 items added to COMPONENT DIES OP 20.	2026-09-30 08:19:16	2026-09-30 08:19:16
01a0f594-3117-7358-b2e4-61baf304b38c	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "PUNCH PIE" [Arrival] status changed to Done.	2026-10-01 03:48:45	2026-10-01 03:48:45
01a0e69e-1884-703c-95f4-e77caa520406	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	JO 126.144 created with categories: PART DIES OP 10, PART DIES OP 20, COMPONENT DIES OP 10, COMPONENT DIES OP 20.	2026-09-28 06:05:15	2026-09-28 06:05:15
01a0e6a2-ed51-7318-88f4-8e6bd44bad53	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Batch: 28 items added to PART DIES OP 10.	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a4-f21b-7188-b810-bd8fc8b852db	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Batch: 34 items added to COMPONENT DIES OP 10.	2026-09-28 06:12:44	2026-09-28 06:12:44
01a0e6a5-d876-71d2-8476-a4177ce4e7db	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Batch: 13 items added to PART DIES OP 20.	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a6-7b41-71e7-801f-cf6128a24c68	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Batch: 12 items added to COMPONENT DIES OP 20.	2026-09-28 06:14:25	2026-09-28 06:14:25
01a0e6b3-90f0-7307-94de-2447930fc10d	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "INS DIE BLOCK 1" [Material] status changed to Done.	2026-09-28 06:28:42	2026-09-28 06:28:42
01a0e6b3-a2c3-723b-972c-0da8e4799670	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "INS DIE BLOCK 1" [Arrival] status changed to Done.	2026-09-28 06:28:47	2026-09-28 06:28:47
01a0e6b3-d1af-72da-8f03-c8d9c6daa55c	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Photo "17905769295222159002872043959300.jpg" added to "INS DIE BLOCK 1" [Machining].	2026-09-28 06:28:59	2026-09-28 06:28:59
01a0e6b3-e67a-7330-9442-1a7dc8fb26db	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "INS DIE BLOCK 1" [Machining] status changed to In Progress.	2026-09-28 06:29:04	2026-09-28 06:29:04
01a0e6b7-2c7e-70cd-93ea-498ad24a639d	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BACKING PUNCH 2" [Material] status changed to Done.	2026-09-28 06:32:39	2026-09-28 06:32:39
01a0e6b7-360c-71b2-baba-a553abc0bd43	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BACKING PUNCH 2" [Arrival] status changed to Done.	2026-09-28 06:32:41	2026-09-28 06:32:41
01a0e6b7-8135-734d-bf37-b7728de634c6	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BACKING PUNCH 2" [Machining] status changed to Not Started.	2026-09-28 06:33:00	2026-09-28 06:33:00
01a0e6b7-b181-70ce-b230-1c1b4c708fc9	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Photo "17905771833373321036547809249446.jpg" added to "BACKING PUNCH 2" [Machining].	2026-09-28 06:33:13	2026-09-28 06:33:13
01a0e6b7-fd53-73df-8784-ce669c14779a	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "PUNCH HOLDER 2" [Material] status changed to Done.	2026-09-28 06:33:32	2026-09-28 06:33:32
01a0e6b8-0501-72eb-a366-2abc441b010b	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "PUNCH HOLDER 2" [Arrival] status changed to Done.	2026-09-28 06:33:34	2026-09-28 06:33:34
01a0e6b8-1ae0-7068-bc22-ce41374c799c	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "PUNCH HOLDER 2" [Machining] status changed to Not Started.	2026-09-28 06:33:40	2026-09-28 06:33:40
01a0e6b8-684e-7250-83e0-7a33d6ec2867	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Photo "17905772298828941682986181895883.jpg" added to "PUNCH HOLDER 2" [Machining].	2026-09-28 06:34:00	2026-09-28 06:34:00
01a0e6b8-aa34-729f-9b34-a05380d5f3db	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE BLANK" [Material] status changed to Done.	2026-09-28 06:34:17	2026-09-28 06:34:17
01a0e6b8-b279-73da-bdd6-d611890a84b7	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE BLANK" [Arrival] status changed to Done.	2026-09-28 06:34:19	2026-09-28 06:34:19
01a0e6b8-c0d2-70c0-853b-5ba7036f41f7	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE BLANK" [Machining] status changed to Not Started.	2026-09-28 06:34:22	2026-09-28 06:34:22
01a0e6b8-f4fb-7182-899e-6ddd9ddfa66a	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Photo "17905772666307565902997998425639.jpg" added to "DIE BLANK" [Machining].	2026-09-28 06:34:36	2026-09-28 06:34:36
01a0e6b9-7fc1-7228-bcc2-e04b11bf96b8	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "STRIPPER 1" [Material] status changed to Done.	2026-09-28 06:35:11	2026-09-28 06:35:11
01a0e6b9-86fd-719e-92fc-6f895e4eabcb	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "STRIPPER 1" [Arrival] status changed to Done.	2026-09-28 06:35:13	2026-09-28 06:35:13
01a0e6b9-9235-703a-8ddd-50a86149d373	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "STRIPPER 1" [Machining] status changed to Not Started.	2026-09-28 06:35:16	2026-09-28 06:35:16
01a0e6b9-c0c9-701a-8507-bf7f2614fc57	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Photo "17905773184651059819898751582691.jpg" added to "STRIPPER 1" [Machining].	2026-09-28 06:35:28	2026-09-28 06:35:28
01a0e6ba-4a95-71bb-a15c-3248493e5aed	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BC PH 1" [Material] status changed to Done.	2026-09-28 06:36:03	2026-09-28 06:36:03
01a0e6ba-51d0-7096-ab7f-e0a8783cece0	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BC PH 1" [Arrival] status changed to Done.	2026-09-28 06:36:05	2026-09-28 06:36:05
01a0e6ba-6146-7276-b4e7-5fd18e7c5d68	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BC PH 1" [Machining] status changed to Not Started.	2026-09-28 06:36:09	2026-09-28 06:36:09
01a0e6ba-be7c-73cd-9ce0-5e3e944a1ed5	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Photo "17905773830232667360556630254407.jpg" added to "BC PH 1" [Machining].	2026-09-28 06:36:33	2026-09-28 06:36:33
01a0e6bb-1d1f-72cf-bdb3-16d48e6f8ec7	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "PH1" [Material] status changed to Done.	2026-09-28 06:36:57	2026-09-28 06:36:57
01a0e6bb-2462-72e1-85d8-09be2e310794	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "PH1" [Arrival] status changed to Done.	2026-09-28 06:36:59	2026-09-28 06:36:59
01a0e6bb-2fcf-7271-aee4-6720534d339d	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "PH1" [Machining] status changed to Not Started.	2026-09-28 06:37:02	2026-09-28 06:37:02
01a0e6bb-b702-7363-af99-e255a1d852c1	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Photo "1790577445725456687530415900362.jpg" added to "PH1" [Machining].	2026-09-28 06:37:36	2026-09-28 06:37:36
01a0e6bc-b479-7282-81fa-c77270e6592f	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BC STRIPPER 1" [Material] status changed to Done.	2026-09-28 06:38:41	2026-09-28 06:38:41
01a0e6bc-ba7c-7260-be5d-913464dfb28a	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BC STRIPPER 1" [Arrival] status changed to Done.	2026-09-28 06:38:43	2026-09-28 06:38:43
01a0e6bc-c429-71cc-8542-d58720e584ed	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BC STRIPPER 1" [Machining] status changed to Not Started.	2026-09-28 06:38:45	2026-09-28 06:38:45
01a0e6bc-f3f7-710a-9fda-8ca72a45e0e3	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Photo "17905775290518768634091925300902.jpg" added to "BC STRIPPER 1" [Machining].	2026-09-28 06:38:58	2026-09-28 06:38:58
01a0e6be-eb35-72d3-a60d-6d47128362cd	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "PAD" [Material] status changed to Done.	2026-09-28 06:41:06	2026-09-28 06:41:06
01a0e6be-f1f5-715d-b988-e89b36a40833	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "PAD" [Arrival] status changed to Done.	2026-09-28 06:41:08	2026-09-28 06:41:08
01a0e6bf-0448-7167-8388-4d1083ba6ba2	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "PAD" [Machining] status changed to Not Started.	2026-09-28 06:41:13	2026-09-28 06:41:13
01a0e6bf-43e9-72d0-9166-f14f45f32f6d	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Photo "17905776758975013185994594710835.jpg" added to "PAD" [Machining].	2026-09-28 06:41:29	2026-09-28 06:41:29
01a0e6bf-81c7-7188-bb25-d388141e2cf2	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BACKING DIE 1" [Material] status changed to Done.	2026-09-28 06:41:45	2026-09-28 06:41:45
01a0e6bf-8948-72bf-a984-068bd7328772	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BACKING DIE 1" [Arrival] status changed to Done.	2026-09-28 06:41:47	2026-09-28 06:41:47
01a0e6bf-935e-71aa-bdf4-ad53413c830c	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BACKING DIE 1" [Machining] status changed to Not Started.	2026-09-28 06:41:49	2026-09-28 06:41:49
01a0e6bf-bf9a-711d-bcfe-06a2794074bf	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Photo "17905777118145296758737340382205.jpg" added to "BACKING DIE 1" [Machining].	2026-09-28 06:42:01	2026-09-28 06:42:01
01a0e6c0-42fb-7300-81f8-c244cedc68c7	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE 1" [Material] status changed to Done.	2026-09-28 06:42:34	2026-09-28 06:42:34
01a0e6c0-499e-7028-910c-252304c5f765	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE 1" [Arrival] status changed to Done.	2026-09-28 06:42:36	2026-09-28 06:42:36
01a0e6c0-59e0-7399-80c3-09c06befe8d8	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE 1" [Machining] status changed to Not Started.	2026-09-28 06:42:40	2026-09-28 06:42:40
01a0e6c0-a8aa-7185-8839-92aa3ef9da40	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Photo "17905777705881456624098426071524.jpg" added to "DIE 1" [Machining].	2026-09-28 06:43:00	2026-09-28 06:43:00
01a0e6c2-c749-700a-83ac-7061d0751542	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "LOWER HOLDER" [Material] status changed to Done.	2026-09-28 06:45:19	2026-09-28 06:45:19
01a0e6c2-cdb8-7306-8848-9d15ed98de51	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "LOWER HOLDER" [Arrival] status changed to Done.	2026-09-28 06:45:21	2026-09-28 06:45:21
01a0e6c3-a3c1-72fb-8e83-f9e66d3c8d11	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "LOWER HOLDER" [Grinding] status changed to In Progress.	2026-09-28 06:46:16	2026-09-28 06:46:16
01a0e6c3-c909-70e1-9fb1-b0a1020097de	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Photo "17905779779576975811572720792992.jpg" added to "LOWER HOLDER" [Grinding].	2026-09-28 06:46:25	2026-09-28 06:46:25
01a0e6ff-ad5a-71b4-a542-e60d4e182f71	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "TOP SHOE" [Arrival] status changed to Done.	2026-09-28 07:51:50	2026-09-28 07:51:50
01a0e6ff-b370-7010-99ed-0784c370478a	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "TOP SHOE" [Material] status changed to Done.	2026-09-28 07:51:52	2026-09-28 07:51:52
01a0e6ff-fbd0-72ed-a1de-600dc0c8cdcd	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "TOP SHOE" [Machining] status changed to Done.	2026-09-28 07:52:10	2026-09-28 07:52:10
01a0e700-3d72-7023-a33a-b946d3dee948	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "TOP SHOE" [Grinding] status changed to Not Started.	2026-09-28 07:52:27	2026-09-28 07:52:27
01a0e700-88ad-72a1-9bfb-d5bdd4ddd282	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "TOP SHOE" [Grinding] status changed to In Progress.	2026-09-28 07:52:47	2026-09-28 07:52:47
01a0e700-9c06-727b-a671-b8ef5229af56	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "TOP SHOE" [Grinding] status changed to Done.	2026-09-28 07:52:51	2026-09-28 07:52:51
01a0e700-a827-7300-ad9e-2f3aed5574cc	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "TOP SHOE" [Grinding] status changed to In Progress.	2026-09-28 07:52:55	2026-09-28 07:52:55
01a0e700-c10c-70bf-9a65-4f8e0a6fb13d	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "TOP SHOE" [Grinding] status changed to Not Started.	2026-09-28 07:53:01	2026-09-28 07:53:01
01a0e702-75c0-70ba-990c-75d15ba39a57	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "TOP SHOE" [Material] status changed to Done.	2026-09-28 07:54:53	2026-09-28 07:54:53
01a0e702-7d50-70cd-987e-08506e2b13ad	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "TOP SHOE" [Arrival] status changed to Done.	2026-09-28 07:54:55	2026-09-28 07:54:55
01a0e702-a35a-72a7-9461-1323f56b05d1	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOTTOM SHOE" [Material] status changed to Done.	2026-09-28 07:55:04	2026-09-28 07:55:04
01a0e702-a875-73d7-ba96-804c6e1ef5b7	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOTTOM SHOE" [Arrival] status changed to Done.	2026-09-28 07:55:06	2026-09-28 07:55:06
01a0e702-c04c-73cb-9e92-1ce51a54397e	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "MAKURA" [Material] status changed to Done.	2026-09-28 07:55:12	2026-09-28 07:55:12
01a0e702-c78d-7005-a8fa-a53f262c89c3	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "MAKURA" [Arrival] status changed to Done.	2026-09-28 07:55:14	2026-09-28 07:55:14
01a0e702-d948-73e2-80fe-059ce8b1b11c	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "MAKURA" [Machining] status changed to Done.	2026-09-28 07:55:18	2026-09-28 07:55:18
01a0e703-6e74-707a-bc73-0481fda5427d	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOTTOM SHOE" [Machining] status changed to Done.	2026-09-28 07:55:56	2026-09-28 07:55:56
01a0e703-8531-721f-bd27-564d720e6561	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "LOWER CLAMPING" [Machining] status changed to Done.	2026-09-28 07:56:02	2026-09-28 07:56:02
01a0e703-a0a9-739d-bb41-30942ff6f6e8	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "LOWER CLAMPING" [Arrival] status changed to Done.	2026-09-28 07:56:09	2026-09-28 07:56:09
01a0e703-a9b6-7082-87fe-5e585e9b7784	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "LOWER CLAMPING" [Material] status changed to Done.	2026-09-28 07:56:12	2026-09-28 07:56:12
01a0e705-a102-7164-ac55-500a3466affd	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "TOP SHOE" [Machining] status changed to Done.	2026-09-28 07:58:20	2026-09-28 07:58:20
01a0e705-c142-7217-bae1-38922f12d23e	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "TOP SHOE" [Grinding] status changed to Not Started.	2026-09-28 07:58:29	2026-09-28 07:58:29
01a0e705-ec45-70dc-a2c1-49a9f3ed5302	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOTTOM SHOE" [Grinding] status changed to Not Started.	2026-09-28 07:58:40	2026-09-28 07:58:40
01a0e706-3310-71e6-a722-08cf9fc7b83a	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "LOWER CLAMPING" [Grinding] status changed to Not Started.	2026-09-28 07:58:58	2026-09-28 07:58:58
01a0e706-4fe0-72ed-af63-49dd5c597283	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "MAKURA" [Grinding] status changed to Not Started.	2026-09-28 07:59:05	2026-09-28 07:59:05
01a0e708-9ec8-71db-a4bf-d1318ab6a89e	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Kirim PO: 2 items to PT Astra Daido (PO: 126.144).	2026-09-28 08:01:36	2026-09-28 08:01:36
01a0e738-4f1c-72ea-89c3-52c178a38391	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE LWR" [Arrival] status changed to Done.	2026-09-28 08:53:42	2026-09-28 08:53:42
01a0e738-8ddb-7001-ab13-dccf60fa5394	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE LWR" [Hardening] status changed to In Progress.	2026-09-28 08:53:58	2026-09-28 08:53:58
01a0eb4e-4b0c-73aa-bb4d-e31ff5d598b6	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE LWR" [Wirecut] status changed to Not Started.	2026-09-29 03:56:11	2026-09-29 03:56:11
01a0ebb9-7991-726a-b4c9-a321f6aa71c1	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "INS DIE BLOCK 1" [Machining] status changed to Done.	2026-09-29 05:53:16	2026-09-29 05:53:16
01a0ebba-00b0-7220-b570-32a31611ec61	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "INS DIE BLOCK 2" [Machining] status changed to Not Started.	2026-09-29 05:53:50	2026-09-29 05:53:50
01a0ebba-e582-7164-a8d2-ae68bf1b16be	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOTTOM SHOE" [Grinding] status changed to Done.	2026-09-29 05:54:49	2026-09-29 05:54:49
01a0ebfe-0a61-72ef-9e1c-f654a31974d6	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BACKING PUNCH 2" [Machining] status changed to In Progress.	2026-09-29 07:08:09	2026-09-29 07:08:09
01a0ec01-e593-739b-9935-26297ec65aaa	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "INS DIE BLOCK 1" [Hardening] status changed to In Progress.	2026-09-29 07:12:22	2026-09-29 07:12:22
01a0f03c-0c20-73f6-98f6-0b6a18226783	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE LWR" [Hardening] status changed to Done.	2026-09-30 02:54:22	2026-09-30 02:54:22
01a0f03d-eb0f-725c-9143-bfdffd23e505	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "DIE UPPR" [Grinding] status changed to Not Started.	2026-09-30 02:56:24	2026-09-30 02:56:24
01a0f040-e7a9-72e6-85d0-4a97e0e0c472	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Bulk Subcont: 1 items sent to CHIYODA for Hardening.	2026-09-30 02:59:40	2026-09-30 02:59:40
01a0f055-e2b6-7039-ba81-d5491197603b	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "MAKURA" [Material] status changed to Done.	2026-09-30 03:22:35	2026-09-30 03:22:35
01a0f059-7b06-7187-9288-3b44caae8ab9	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Bulk Target Arrival set to 2026-09-29 for 2 items.	2026-09-30 03:26:31	2026-09-30 03:26:31
01a0f06a-4ad0-736c-8514-8733e6236003	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Bulk Target Arrival set to 2026-10-01 for 2 items.	2026-09-30 03:44:52	2026-09-30 03:44:52
01a0f06d-7d38-70da-b494-8bf8b96f4631	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Bulk status updated for 1 items (Arrival) → In Progress.	2026-09-30 03:48:22	2026-09-30 03:48:22
01a0f06d-d2f6-73ef-ac00-23f794a36584	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOLT L" [Arrival] status changed to Done.	2026-09-30 03:48:44	2026-09-30 03:48:44
01a0f06e-83e7-7220-948f-91b5eaea8454	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "SPRING" [Arrival] status changed to In Progress.	2026-09-30 03:49:29	2026-09-30 03:49:29
01a0f070-b053-72ac-8b4c-e9fdcf7f52d4	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOLT L" [PO] status changed to Done.	2026-09-30 03:51:52	2026-09-30 03:51:52
01a0f070-f63f-72bf-af73-24af0c1a46e7	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOLT L" [PO] status changed to Done.	2026-09-30 03:52:10	2026-09-30 03:52:10
01a0f071-439e-71f7-865b-cfff06bdbcaf	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOLT L" [PO] status changed to Not Started.	2026-09-30 03:52:29	2026-09-30 03:52:29
01a0f085-a6ad-714c-8ce2-7e30c19a17c5	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BACKING DIE 1" [Grinding] status changed to Done.	2026-09-30 04:14:45	2026-09-30 04:14:45
01a0f09b-29a2-7364-93b5-6d2bde4e08db	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "LOWER CLAMPING PLATE" [Material] status changed to Done.	2026-09-30 04:38:15	2026-09-30 04:38:15
01a0f09c-7ef2-701f-929e-ddd6bd2b00ba	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Photo "17907431342567866673381594983709.jpg" added to "LOWER CLAMPING PLATE" [Machining].	2026-09-30 04:39:43	2026-09-30 04:39:43
01a0f0a5-5a48-70d1-ab24-b3f4d402cefb	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BC UPPR" [Arrival] status changed to Done.	2026-09-30 04:49:23	2026-09-30 04:49:23
01a0f0ab-0b4c-7212-9b12-5cece68ef57b	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Photo "makura.jpg" added to "MAKURA" [Machining].	2026-09-30 04:55:36	2026-09-30 04:55:36
01a0f12f-c020-73c1-bc02-6407055d282e	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Batch: 4 items added to MATERIAL JIG KERATAAN.	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f13b-17e1-73e5-a365-5124ad0364cb	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "STRIPPER GUIDE PIN" updated.	2026-09-30 07:32:56	2026-09-30 07:32:56
01a0f13b-9055-7182-bc60-3af166187180	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "BOLT L" [PO] status changed to Done.	2026-09-30 07:33:27	2026-09-30 07:33:27
01a0f144-9081-71ad-b182-aaa0c834abb9	b62005c8-a3fd-483f-b68e-6dc3ef2255a8	Batch: 22 items added to PART DIES OP 20.	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f175-3ced-72fe-9192-f59dafaa4e98	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "PAD" [Grinding] status changed to Not Started.	2026-09-30 08:36:27	2026-09-30 08:36:27
01a0f594-3a2f-726d-b670-bcf5ade03b9b	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	Item "PUNCH PIE" [Arrival] status changed to Done.	2026-10-01 03:48:47	2026-10-01 03:48:47
\.


--
-- Data for Name: cache; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cache (key, value, expiration) FROM stdin;
laravel-cache-6d1b749080773732575c484cc4665cbe	i:2;	1790662960
laravel-cache-test_counter	i:2;	2105923077
laravel-cache-gemini_ocr_rr_counter	i:18;	2105923108
laravel-cache-ocr:1:timer	i:1790662887;	1790662887
laravel-cache-0c0b1bf06ced53c8fce56b1d07ca0f60:timer	i:1790756405;	1790756405
laravel-cache-0c0b1bf06ced53c8fce56b1d07ca0f60	i:1;	1790756405
laravel-cache-ocr:127.0.0.1:timer	i:1790662934;	1790662934
laravel-cache-ocr:127.0.0.1	i:12;	1790662934
laravel-cache-6d1b749080773732575c484cc4665cbe:timer	i:1790662960;	1790662960
laravel-cache-7faba74cbe35423875550f73b47e992c:timer	i:1790662960;	1790662960
laravel-cache-7faba74cbe35423875550f73b47e992c	i:10;	1790662960
\.


--
-- Data for Name: cache_locks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cache_locks (key, owner, expiration) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, jo_id, label, kind, is_custom, sort_order, created_at, updated_at) FROM stdin;
01a0e69e-1879-7204-a5cb-09abb3318484	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	PART DIES OP 10	Part	f	1	2026-09-28 06:05:15	2026-09-28 06:05:15
01a0e69e-1880-73ba-8d90-ca32f2f69b46	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	PART DIES OP 20	Part	f	2	2026-09-28 06:05:15	2026-09-28 06:05:15
01a0eb56-6d83-72fa-a99c-c0ffabd5660b	63372c05-6dae-41b3-a650-941e70f54f2e	PART DIES OP 10	Part	f	1	2026-09-29 04:05:05	2026-09-29 04:05:05
01a0eb56-6d89-7000-8199-cee6455b2569	63372c05-6dae-41b3-a650-941e70f54f2e	PART DIES OP 20	Part	f	2	2026-09-29 04:05:05	2026-09-29 04:05:05
01a0eb56-6d8a-73ac-8c81-f21a4139b2bd	63372c05-6dae-41b3-a650-941e70f54f2e	COMPONENT DIES OP 10	Component	f	3	2026-09-29 04:05:05	2026-09-29 04:05:05
01a0eb56-6d8b-72f1-a3b9-8400edf9c566	63372c05-6dae-41b3-a650-941e70f54f2e	COMPONENT DIES OP 20	Component	f	4	2026-09-29 04:05:05	2026-09-29 04:05:05
01a0f12b-98ae-7266-b835-b558fafc00b9	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	PART JIG	Part	t	3	2026-09-30 07:16:01	2026-09-30 07:16:01
01a0e69e-1881-73b3-9dfc-701ffddf5816	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	COMPONENT DIES OP 10	Component	f	5	2026-09-28 06:05:15	2026-09-30 07:17:12
01a0e69e-1882-7124-b62a-9c152c52a842	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	COMPONENT DIES OP 20	Component	f	6	2026-09-28 06:05:15	2026-09-30 07:17:12
01a0f12c-ae94-7137-bfb2-4ea3596651db	bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	MATERIAL JIG KERATAAN	Part	t	4	2026-09-30 07:17:12	2026-09-30 07:17:12
01a0f140-68a8-715b-aee6-624d76f7b569	b62005c8-a3fd-483f-b68e-6dc3ef2255a8	PART DIES OP 10	Part	f	1	2026-09-30 07:38:45	2026-09-30 07:38:45
01a0f140-68ad-736b-bc30-76e7e19a319e	b62005c8-a3fd-483f-b68e-6dc3ef2255a8	PART DIES OP 20	Part	f	2	2026-09-30 07:38:45	2026-09-30 07:38:45
01a0f140-68ae-72fd-9ce2-832bed8bd9f1	b62005c8-a3fd-483f-b68e-6dc3ef2255a8	PART DIES OP 30	Part	f	3	2026-09-30 07:38:45	2026-09-30 07:38:45
01a0f140-68af-739b-a72c-d3089f1afcd7	b62005c8-a3fd-483f-b68e-6dc3ef2255a8	COMPONENT DIES OP 10	Component	f	4	2026-09-30 07:38:45	2026-09-30 07:38:45
01a0f140-68b0-7175-b974-7de964332778	b62005c8-a3fd-483f-b68e-6dc3ef2255a8	COMPONENT DIES OP 20	Component	f	5	2026-09-30 07:38:45	2026-09-30 07:38:45
01a0f140-68b2-71ec-a2d0-fd441e448295	b62005c8-a3fd-483f-b68e-6dc3ef2255a8	COMPONENT DIES OP 30	Component	f	6	2026-09-30 07:38:45	2026-09-30 07:38:45
\.


--
-- Data for Name: controls; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.controls (id, item_id, process, status, notes, in_progress_at, target_date, created_at, updated_at) FROM stdin;
01a0e6a2-ecf5-73b0-92c1-a110b59aa251	e953e46f-9b7c-4472-b54f-5b655218d956	Material	Done		\N	\N	2026-09-28 06:10:32	2026-09-28 06:28:42
01a0e6a2-ec5d-714c-99f7-343041c51058	36dc892a-1a16-4413-a095-e54a75acfb0c	Material	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 04:38:02
01a0e6a2-ec62-7013-86d5-95425163e021	36dc892a-1a16-4413-a095-e54a75acfb0c	Arrival	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 04:38:03
01a0f12f-bffd-70b9-b512-805303e79614	a3ee7974-a997-48f5-9944-3efd8c14a4a7	Machining	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-bfff-7050-899a-8eb6c570bc56	a3ee7974-a997-48f5-9944-3efd8c14a4a7	Hardening	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c000-717f-9877-60ffe0d0d04d	a3ee7974-a997-48f5-9944-3efd8c14a4a7	Grinding	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c001-737c-bf5d-698759cec2b8	a3ee7974-a997-48f5-9944-3efd8c14a4a7	Wirecut	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c002-7077-b48d-338e92e77385	a3ee7974-a997-48f5-9944-3efd8c14a4a7	Assembly	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c005-71b0-8645-46679ab3c1a4	1e0b09f0-2be4-4451-8619-c63e62949065	Material	Not Started		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c006-7044-9de1-b23bf74bf674	1e0b09f0-2be4-4451-8619-c63e62949065	Arrival	Not Started		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c007-7132-a64f-5aa19a933435	1e0b09f0-2be4-4451-8619-c63e62949065	Machining	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c008-7068-8252-4aef95a331a2	1e0b09f0-2be4-4451-8619-c63e62949065	Hardening	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c00a-73bf-b81f-55d3151e82c0	1e0b09f0-2be4-4451-8619-c63e62949065	Grinding	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c00b-7171-a8d1-6e393565b0ee	1e0b09f0-2be4-4451-8619-c63e62949065	Wirecut	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c00c-702e-96fc-69b7e4c54cce	1e0b09f0-2be4-4451-8619-c63e62949065	Assembly	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c00f-7318-9920-797e2d75e809	0d7d9f7d-e752-430b-95a3-ab0c3422c093	Material	Not Started		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c010-734d-8367-5263dab2fc38	0d7d9f7d-e752-430b-95a3-ab0c3422c093	Arrival	Not Started		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c011-73aa-ac16-23ccf332b13c	0d7d9f7d-e752-430b-95a3-ab0c3422c093	Machining	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c012-70ed-a4a5-413b47731be2	0d7d9f7d-e752-430b-95a3-ab0c3422c093	Hardening	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c013-730c-b4c5-363503f4ffb5	0d7d9f7d-e752-430b-95a3-ab0c3422c093	Grinding	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c014-728e-898c-fc80c34d3800	0d7d9f7d-e752-430b-95a3-ab0c3422c093	Wirecut	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c015-7269-932e-948a01350db1	0d7d9f7d-e752-430b-95a3-ab0c3422c093	Assembly	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c018-72d6-8326-36306bc18e4c	a06d3f3e-30ac-4bcc-a186-5dd9b046134f	Material	Not Started		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c019-735a-a721-204a37991a80	a06d3f3e-30ac-4bcc-a186-5dd9b046134f	Arrival	Not Started		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c01a-7199-ae32-4f1e94ce6991	a06d3f3e-30ac-4bcc-a186-5dd9b046134f	Machining	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c01b-70d0-9e37-3cd48f56d1b7	a06d3f3e-30ac-4bcc-a186-5dd9b046134f	Hardening	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c01c-70a5-9191-dff2d008b1fb	a06d3f3e-30ac-4bcc-a186-5dd9b046134f	Grinding	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c01d-71ae-80f5-82d4ca4dec8d	a06d3f3e-30ac-4bcc-a186-5dd9b046134f	Wirecut	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-c01e-7012-82fd-127011329df0	a06d3f3e-30ac-4bcc-a186-5dd9b046134f	Assembly	-		\N	\N	2026-09-30 07:20:33	2026-09-30 07:20:33
01a0f12f-bfeb-70bc-94f0-aad1e51c379e	a3ee7974-a997-48f5-9944-3efd8c14a4a7	Material	Done		2026-09-30 07:25:01	\N	2026-09-30 07:20:33	2026-09-30 07:25:01
01a0f12f-bffc-713e-9555-e747f304ea68	a3ee7974-a997-48f5-9944-3efd8c14a4a7	Arrival	In Progress		2026-09-30 07:25:01	2026-10-01	2026-09-30 07:20:33	2026-09-30 07:25:01
01a0f144-903f-7214-b6d0-7c7eb68033a7	7665747c-6bb8-49d5-8602-d23f5638a6e1	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-903f-7214-b6d0-7c7eb74bf62a	7665747c-6bb8-49d5-8602-d23f5638a6e1	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9042-71e6-a6f7-b92dd63dd9cf	22d77139-cd23-4862-944c-f6de14acd71e	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9043-73c5-8f63-ca7d07cc2ea5	22d77139-cd23-4862-944c-f6de14acd71e	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9044-72ee-b9b6-f88aae3581f2	22d77139-cd23-4862-944c-f6de14acd71e	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9045-7209-acb1-260c59248a8e	22d77139-cd23-4862-944c-f6de14acd71e	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9047-7193-afae-ddb18afc3b8c	22d77139-cd23-4862-944c-f6de14acd71e	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9048-739b-9529-914710c25608	22d77139-cd23-4862-944c-f6de14acd71e	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9049-7219-9e73-66de1b047274	22d77139-cd23-4862-944c-f6de14acd71e	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-904b-71ea-8d48-8422f19886f8	e2096ae3-8c4e-4031-a2f5-7b4cd7930157	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-904d-718e-9333-dc543152e0a3	e2096ae3-8c4e-4031-a2f5-7b4cd7930157	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-904e-71e0-8910-80e1008420ac	e2096ae3-8c4e-4031-a2f5-7b4cd7930157	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-904f-7123-818c-906ea2afab55	e2096ae3-8c4e-4031-a2f5-7b4cd7930157	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9050-73f3-902a-3ec301cc7294	e2096ae3-8c4e-4031-a2f5-7b4cd7930157	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9051-727d-a06a-071a5404a49d	e2096ae3-8c4e-4031-a2f5-7b4cd7930157	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9052-7113-9e0b-743279b73f8e	e2096ae3-8c4e-4031-a2f5-7b4cd7930157	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9054-737f-9d3e-fa545c1d2377	97143831-58e6-4cf3-830a-86b16d468ac9	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9055-71dc-859e-f14d5a3d0c80	97143831-58e6-4cf3-830a-86b16d468ac9	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9056-7175-bef9-d5d30e4d9aea	97143831-58e6-4cf3-830a-86b16d468ac9	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9058-7167-9d7f-4f0a660e901a	97143831-58e6-4cf3-830a-86b16d468ac9	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9059-723c-a60f-ac71d2bd0fb1	97143831-58e6-4cf3-830a-86b16d468ac9	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-905a-7015-98d5-b46ac3e81b76	97143831-58e6-4cf3-830a-86b16d468ac9	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-905b-72af-bc55-c846b05ba237	97143831-58e6-4cf3-830a-86b16d468ac9	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-905d-73e6-9129-521c949ec5dc	baa1e370-15f1-4b96-94d1-afd46932997c	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-905e-72fb-9886-138468e7b4df	baa1e370-15f1-4b96-94d1-afd46932997c	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-905f-702a-b97e-d9d734bb5694	baa1e370-15f1-4b96-94d1-afd46932997c	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9060-7323-887e-ba4d401c2046	baa1e370-15f1-4b96-94d1-afd46932997c	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9061-72d4-a368-fbace6aa6db9	baa1e370-15f1-4b96-94d1-afd46932997c	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9062-717b-9f64-4bc5f5a2ee18	baa1e370-15f1-4b96-94d1-afd46932997c	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9063-700e-9f94-3bc98f190296	baa1e370-15f1-4b96-94d1-afd46932997c	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9078-7216-995c-449b6e2679e7	e8509622-d30d-403d-9ad3-11ed32de0a36	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9079-71ce-8e9b-95c62eaee0fb	e8509622-d30d-403d-9ad3-11ed32de0a36	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-907b-70f9-af25-60fc41463f54	e8509622-d30d-403d-9ad3-11ed32de0a36	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-907c-70be-85e2-868af3cefbce	e8509622-d30d-403d-9ad3-11ed32de0a36	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-907d-7020-9b9d-ed52d40676d4	e8509622-d30d-403d-9ad3-11ed32de0a36	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-907e-73b1-938c-38ca50d55ef6	e8509622-d30d-403d-9ad3-11ed32de0a36	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-907f-7194-9e4e-3479dd71119d	e8509622-d30d-403d-9ad3-11ed32de0a36	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f165-8032-7335-8a44-cc2c9cbce1d2	a79f29b4-9241-4c07-91fd-5f53c75ac8d9	PO	Not Started		\N	\N	2026-09-30 08:19:16	2026-09-30 08:19:16
01a0f165-8039-7371-b0ad-51a77a9d8453	a79f29b4-9241-4c07-91fd-5f53c75ac8d9	Arrival	Not Started		\N	\N	2026-09-30 08:19:16	2026-09-30 08:19:16
01a0f165-803c-73d1-955d-2aa761e26778	f520221d-46df-47e4-b0c3-5f1542ad1426	PO	Not Started		\N	\N	2026-09-30 08:19:16	2026-09-30 08:19:16
01a0f165-803e-725e-8264-a660d750a3f8	f520221d-46df-47e4-b0c3-5f1542ad1426	Arrival	Not Started		\N	\N	2026-09-30 08:19:16	2026-09-30 08:19:16
01a0f165-8042-72be-b10b-11e76b82f9ff	a9ba7db7-175b-4098-a799-05fe2bd3838a	PO	Not Started		\N	\N	2026-09-30 08:19:16	2026-09-30 08:19:16
01a0f165-8047-7003-bd3f-00e761327aa1	a9ba7db7-175b-4098-a799-05fe2bd3838a	Arrival	Not Started		\N	\N	2026-09-30 08:19:16	2026-09-30 08:19:16
01a0f165-804c-70db-9765-aea8c9d5f11d	8bcece61-ab1b-4f83-ba6a-a26b46ad0d5f	PO	Not Started		\N	\N	2026-09-30 08:19:16	2026-09-30 08:19:16
01a0f165-804e-7175-9253-aead061451cd	8bcece61-ab1b-4f83-ba6a-a26b46ad0d5f	Arrival	Not Started		\N	\N	2026-09-30 08:19:16	2026-09-30 08:19:16
01a0f165-8050-70de-8dd8-ebb88b9a9e22	0df7b62c-d6f7-47a2-89a9-0369c134fa30	PO	Not Started		\N	\N	2026-09-30 08:19:16	2026-09-30 08:19:16
01a0f165-8051-727d-a456-0cc3ca7abd52	0df7b62c-d6f7-47a2-89a9-0369c134fa30	Arrival	Not Started		\N	\N	2026-09-30 08:19:16	2026-09-30 08:19:16
01a0f165-8054-7344-a4d8-72695a94b349	78ee738f-5994-4db3-ac25-994effe2253e	PO	Not Started		\N	\N	2026-09-30 08:19:16	2026-09-30 08:19:16
01a0e6a2-ecb9-70bc-8a44-1e609c8df0e2	9ef3823d-c8c6-4a47-9ec7-bbcbf4be5cda	Material	Done		\N	\N	2026-09-28 06:10:32	2026-09-28 06:41:06
01a0f131-02f6-73bf-b6cc-579dfdeaa85a	d3bae093-04b1-4777-a223-ff8814ec1c80	Material	Not Started		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-02fb-7278-b246-9286b20a6b32	d3bae093-04b1-4777-a223-ff8814ec1c80	Arrival	Not Started		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-02fc-7031-8134-4f01c6d08b57	d3bae093-04b1-4777-a223-ff8814ec1c80	Machining	-		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-02fd-73e4-a931-9061e7829751	d3bae093-04b1-4777-a223-ff8814ec1c80	Hardening	-		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-02fe-73a3-8fe1-a027d43deef6	d3bae093-04b1-4777-a223-ff8814ec1c80	Grinding	-		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-02ff-71c7-b763-38a0d78d8655	d3bae093-04b1-4777-a223-ff8814ec1c80	Wirecut	-		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-0300-71af-b85d-543cfab8b90b	d3bae093-04b1-4777-a223-ff8814ec1c80	Assembly	-		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-0302-70dd-afca-eae2c7135580	01369c40-5682-4e29-992c-ed12dbe65121	Material	Not Started		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-0303-7205-a485-0bf561d0bce7	01369c40-5682-4e29-992c-ed12dbe65121	Arrival	Not Started		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-0304-728e-a25a-75c35c461edd	01369c40-5682-4e29-992c-ed12dbe65121	Machining	-		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-0305-71de-be39-0841712bd846	01369c40-5682-4e29-992c-ed12dbe65121	Hardening	-		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-0306-7135-8861-70a2a1d6e220	01369c40-5682-4e29-992c-ed12dbe65121	Grinding	-		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-0307-70c1-9f63-eeb4f987e733	01369c40-5682-4e29-992c-ed12dbe65121	Wirecut	-		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-0308-7326-b55c-474044437f69	01369c40-5682-4e29-992c-ed12dbe65121	Assembly	-		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-030a-70a7-86f7-cf7478699be6	a6b080af-8525-4373-b28a-d59375af9a5d	Material	Not Started		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-030a-70a7-86f7-cf7479518b4a	a6b080af-8525-4373-b28a-d59375af9a5d	Arrival	Not Started		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-030b-7110-a424-6d04160bcaf2	a6b080af-8525-4373-b28a-d59375af9a5d	Machining	-		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-030c-70b8-9ef8-d1559bb5ab88	a6b080af-8525-4373-b28a-d59375af9a5d	Hardening	-		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-030d-7072-a787-55d11aa5ef9e	a6b080af-8525-4373-b28a-d59375af9a5d	Grinding	-		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-030d-7072-a787-55d11b003742	a6b080af-8525-4373-b28a-d59375af9a5d	Wirecut	-		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f131-030e-726a-bd69-3b6aeca737ec	a6b080af-8525-4373-b28a-d59375af9a5d	Assembly	-		\N	\N	2026-09-30 07:21:56	2026-09-30 07:21:56
01a0f164-5eb7-7365-b96b-8f79a4f6ba3e	9eeb94bc-588e-4f97-8b45-caa33f41cd79	Material	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ebd-73f0-aa74-6101118b481a	9eeb94bc-588e-4f97-8b45-caa33f41cd79	Arrival	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ebe-70a9-adc6-02e33dbd61c2	9eeb94bc-588e-4f97-8b45-caa33f41cd79	Machining	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ec0-73c5-8609-9636c868a0df	9eeb94bc-588e-4f97-8b45-caa33f41cd79	Hardening	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ec1-7155-953e-0fb7c3746976	9eeb94bc-588e-4f97-8b45-caa33f41cd79	Grinding	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ec2-70fb-9b26-35ecb385c8eb	9eeb94bc-588e-4f97-8b45-caa33f41cd79	Wirecut	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ec4-704a-8b1c-6166ad4a2431	9eeb94bc-588e-4f97-8b45-caa33f41cd79	Assembly	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ec7-73ee-a0d7-a7a8c30741b6	81bfad5a-5add-481c-8151-4895a260f47f	Material	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ec8-7023-83e3-69da981c5759	81bfad5a-5add-481c-8151-4895a260f47f	Arrival	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ec9-7337-bae0-7fe11a4c72fb	81bfad5a-5add-481c-8151-4895a260f47f	Machining	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5eca-712d-9079-272a9a266d9f	81bfad5a-5add-481c-8151-4895a260f47f	Hardening	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ecb-7173-81cf-1eac22796a3f	81bfad5a-5add-481c-8151-4895a260f47f	Grinding	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ecc-7023-b5f1-6445038357d8	81bfad5a-5add-481c-8151-4895a260f47f	Wirecut	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ece-72a1-a93d-93a73211c242	81bfad5a-5add-481c-8151-4895a260f47f	Assembly	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ed1-729c-a5d6-410f7969a16b	4cde01ea-8242-4727-8efc-42c6bee678bf	Material	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ed2-70e8-926e-046490f7f97f	4cde01ea-8242-4727-8efc-42c6bee678bf	Arrival	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ed3-7284-8acc-8cd9e00f9043	4cde01ea-8242-4727-8efc-42c6bee678bf	Machining	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ed5-71d8-b259-bfcc6c8b0bed	4cde01ea-8242-4727-8efc-42c6bee678bf	Hardening	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ed7-70d1-a781-250f5068f996	4cde01ea-8242-4727-8efc-42c6bee678bf	Grinding	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ed9-72d5-86b2-6b1e8f7115a1	4cde01ea-8242-4727-8efc-42c6bee678bf	Wirecut	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5eda-7189-a906-828945f6c6c4	4cde01ea-8242-4727-8efc-42c6bee678bf	Assembly	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5edc-7115-b1b5-bb743433f1de	81995e94-ed48-4798-b915-e45ca2d1cede	Material	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5edd-7147-92fa-35498732506a	81995e94-ed48-4798-b915-e45ca2d1cede	Arrival	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ede-7380-80b9-f2bb58f80c4b	81995e94-ed48-4798-b915-e45ca2d1cede	Machining	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5edf-737b-8dd5-de8412ffd8cb	81995e94-ed48-4798-b915-e45ca2d1cede	Hardening	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ee0-7178-ab31-b82c42d9e6a3	81995e94-ed48-4798-b915-e45ca2d1cede	Grinding	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ee1-708d-a4fe-25bef2cff970	81995e94-ed48-4798-b915-e45ca2d1cede	Wirecut	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ee2-719d-ac87-2abe22812e63	81995e94-ed48-4798-b915-e45ca2d1cede	Assembly	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ee6-7251-9f4a-70b61d511782	65a3f531-3a26-403c-a76d-e27fe705034a	Material	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ee7-70b0-8881-d3a770184e08	65a3f531-3a26-403c-a76d-e27fe705034a	Arrival	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ee8-73c9-9fad-54527fbc5c7a	65a3f531-3a26-403c-a76d-e27fe705034a	Machining	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ee9-72b4-a6f8-22e02e02b547	65a3f531-3a26-403c-a76d-e27fe705034a	Hardening	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5eea-7088-bcfc-83349cf3f78b	65a3f531-3a26-403c-a76d-e27fe705034a	Grinding	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5eeb-733e-9184-400b5bfb6271	65a3f531-3a26-403c-a76d-e27fe705034a	Wirecut	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5eec-727a-b890-cc840f1b4e03	65a3f531-3a26-403c-a76d-e27fe705034a	Assembly	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5eef-71ec-8a55-5c7eb031a1ec	3b8e497d-b662-48d1-b1e1-31fc53b3c309	Material	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ef0-73cb-b917-c71b1a0ef41a	3b8e497d-b662-48d1-b1e1-31fc53b3c309	Arrival	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ef1-71af-92cc-c43cc3b52852	3b8e497d-b662-48d1-b1e1-31fc53b3c309	Machining	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ef2-7191-9505-a40e18c50330	3b8e497d-b662-48d1-b1e1-31fc53b3c309	Hardening	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ef3-7208-817e-30e41566642b	3b8e497d-b662-48d1-b1e1-31fc53b3c309	Grinding	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ef5-7073-a937-ffcbe0f99853	3b8e497d-b662-48d1-b1e1-31fc53b3c309	Wirecut	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ef7-72c3-a394-2563128b3882	3b8e497d-b662-48d1-b1e1-31fc53b3c309	Assembly	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5ef9-70e8-a79f-afce5116f661	320797a3-ca84-4e59-a036-a45952c725f3	Material	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5efb-71e2-aa35-bab813eb264a	320797a3-ca84-4e59-a036-a45952c725f3	Arrival	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5efc-7361-9490-8b04a57d0733	320797a3-ca84-4e59-a036-a45952c725f3	Machining	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5efd-72a4-8ec4-493cd3202e2c	320797a3-ca84-4e59-a036-a45952c725f3	Hardening	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5efe-73a5-ba1b-369961a85a37	320797a3-ca84-4e59-a036-a45952c725f3	Grinding	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5eff-71d8-8450-690b4189a157	320797a3-ca84-4e59-a036-a45952c725f3	Wirecut	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f00-7114-8456-f5856ebbc47d	320797a3-ca84-4e59-a036-a45952c725f3	Assembly	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f03-7005-b5d7-51f8f7182200	d5538177-814b-49a4-bddc-bb5494d15d3f	Material	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f04-71c7-b9d3-6ab455a45ce9	d5538177-814b-49a4-bddc-bb5494d15d3f	Arrival	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f05-72c6-9f95-1dc083f4508c	d5538177-814b-49a4-bddc-bb5494d15d3f	Machining	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f07-72a3-87f7-ee0370dd7d9c	d5538177-814b-49a4-bddc-bb5494d15d3f	Hardening	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f08-7111-a566-9ff81ae9695f	d5538177-814b-49a4-bddc-bb5494d15d3f	Grinding	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f09-723d-b9f5-8b9c0b24e373	d5538177-814b-49a4-bddc-bb5494d15d3f	Wirecut	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f0a-7280-b2d5-aabf4c548068	d5538177-814b-49a4-bddc-bb5494d15d3f	Assembly	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f0c-7191-b2a0-231a8e1b5057	ef51fa11-3d2d-43bf-9b19-fa828e3f6b28	Material	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0e6a5-d846-7131-9385-8a80563ca584	daf585e6-8461-4cb9-b830-b415f8ce0a0b	Material	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 07:55:04
01a0e6a2-ec63-71b0-b6cb-f2f37bad8984	36dc892a-1a16-4413-a095-e54a75acfb0c	Machining	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-30 04:41:42
01a0f13d-38a0-7125-8e97-f1d76d4dc674	df9aae9b-e7c0-464a-8323-b7db10dbff22	Material	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38a5-708d-a8aa-2256cb5bed6c	df9aae9b-e7c0-464a-8323-b7db10dbff22	Arrival	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38a7-71da-8b90-6c430b12a2db	df9aae9b-e7c0-464a-8323-b7db10dbff22	Machining	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38a8-70c0-8eb2-a79df76f4e1c	df9aae9b-e7c0-464a-8323-b7db10dbff22	Hardening	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38a9-717f-9c03-47914641af5c	df9aae9b-e7c0-464a-8323-b7db10dbff22	Grinding	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38aa-7032-9ed2-c24d43e3225d	df9aae9b-e7c0-464a-8323-b7db10dbff22	Wirecut	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38ac-7352-b920-c0e36bfa2028	df9aae9b-e7c0-464a-8323-b7db10dbff22	Assembly	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38af-7248-b42a-687a935971de	da2f3305-11e4-489f-ac68-014a20d1c0a4	Material	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38b0-712d-861c-952da08e1b82	da2f3305-11e4-489f-ac68-014a20d1c0a4	Arrival	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38b1-71ee-94ea-4efd43a7900a	da2f3305-11e4-489f-ac68-014a20d1c0a4	Machining	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38b2-7355-9050-a408a18917c5	da2f3305-11e4-489f-ac68-014a20d1c0a4	Hardening	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38b3-719f-a385-8d222423932d	da2f3305-11e4-489f-ac68-014a20d1c0a4	Grinding	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0e6a2-ec65-71d2-8ea6-cb034bc21a70	36dc892a-1a16-4413-a095-e54a75acfb0c	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0f13d-38b4-7239-bb70-1d160d41f3e7	da2f3305-11e4-489f-ac68-014a20d1c0a4	Wirecut	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38b5-73a4-af2a-26567026692a	da2f3305-11e4-489f-ac68-014a20d1c0a4	Assembly	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38b7-71a1-8a9c-5040dea93462	c12011a8-961c-4e54-bf74-b20279e6c424	Material	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38b8-70ae-874c-70a6a324c6a8	c12011a8-961c-4e54-bf74-b20279e6c424	Arrival	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38b9-7256-8d0c-9e5f78956f03	c12011a8-961c-4e54-bf74-b20279e6c424	Machining	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38ba-712a-b4b6-e0dc35f4f5fc	c12011a8-961c-4e54-bf74-b20279e6c424	Hardening	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38bc-732c-9634-3cd9f24777a3	c12011a8-961c-4e54-bf74-b20279e6c424	Grinding	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38bd-725e-b628-32b02fca93ff	c12011a8-961c-4e54-bf74-b20279e6c424	Wirecut	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38be-7090-917c-43becbcbf834	c12011a8-961c-4e54-bf74-b20279e6c424	Assembly	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38c0-7082-9b3e-e4ba7b692664	14117cca-567a-4394-a4ab-d7e1ff23a78f	Material	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38c2-7274-b744-8aa1359955c3	14117cca-567a-4394-a4ab-d7e1ff23a78f	Arrival	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38c3-71c0-bbca-e70daa907a07	14117cca-567a-4394-a4ab-d7e1ff23a78f	Machining	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38c4-735e-a203-b54cd97411dd	14117cca-567a-4394-a4ab-d7e1ff23a78f	Hardening	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38c5-707a-902a-1ddfc23bba62	14117cca-567a-4394-a4ab-d7e1ff23a78f	Grinding	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38c5-707a-902a-1ddfc2a68e77	14117cca-567a-4394-a4ab-d7e1ff23a78f	Wirecut	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38c6-7129-9f2a-6c1dc79a0b7e	14117cca-567a-4394-a4ab-d7e1ff23a78f	Assembly	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38c9-70a1-a10a-25c4228d9953	38b950e0-ab39-4b05-8a81-008cbc8864a3	Material	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38ca-73c9-a521-88adc5bc1676	38b950e0-ab39-4b05-8a81-008cbc8864a3	Arrival	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38cb-706d-aa3d-4e1bdd98d630	38b950e0-ab39-4b05-8a81-008cbc8864a3	Machining	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38cd-70f3-8c43-03637bc80363	38b950e0-ab39-4b05-8a81-008cbc8864a3	Hardening	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38ce-7263-9679-a3b477fae722	38b950e0-ab39-4b05-8a81-008cbc8864a3	Grinding	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38cf-7147-9f1f-a0f8e3b8c848	38b950e0-ab39-4b05-8a81-008cbc8864a3	Wirecut	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38d0-7017-ad71-df19eb0282af	38b950e0-ab39-4b05-8a81-008cbc8864a3	Assembly	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38d2-71d8-9caa-19a96f82fb5c	a41641fb-1ccd-4048-82f1-e5714aa1a31e	Material	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38d4-7325-8142-c601e5e1e3be	a41641fb-1ccd-4048-82f1-e5714aa1a31e	Arrival	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38d5-7272-844f-4e04bd1bdb9e	a41641fb-1ccd-4048-82f1-e5714aa1a31e	Machining	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38d6-7397-a813-3580ec51714e	a41641fb-1ccd-4048-82f1-e5714aa1a31e	Hardening	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38d7-707f-b5c5-9b639669ebe2	a41641fb-1ccd-4048-82f1-e5714aa1a31e	Grinding	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38d8-714e-b63e-003ac8050828	a41641fb-1ccd-4048-82f1-e5714aa1a31e	Wirecut	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38d9-70af-a762-5d3b76376d73	a41641fb-1ccd-4048-82f1-e5714aa1a31e	Assembly	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38da-7311-9959-a77cc60cff1d	f0a2f404-37fe-44b2-ac95-216de3cb2569	Material	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38db-73ec-b0ee-06a12dd4bbca	f0a2f404-37fe-44b2-ac95-216de3cb2569	Arrival	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38dc-728a-8018-48b70599e440	f0a2f404-37fe-44b2-ac95-216de3cb2569	Machining	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38de-712d-aa15-5697f261b6aa	f0a2f404-37fe-44b2-ac95-216de3cb2569	Hardening	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38de-712d-aa15-5697f2ba4cef	f0a2f404-37fe-44b2-ac95-216de3cb2569	Grinding	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38df-7036-a808-63b9007a37cb	f0a2f404-37fe-44b2-ac95-216de3cb2569	Wirecut	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38e0-733f-b919-876dfca73699	f0a2f404-37fe-44b2-ac95-216de3cb2569	Assembly	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38e2-705d-b1b0-bf86ed20ecc5	df1d0ba0-a668-4cc4-8dce-85e0f1f19a11	Material	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38e3-7324-96d5-f3f83da4bbe9	df1d0ba0-a668-4cc4-8dce-85e0f1f19a11	Arrival	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38e3-7324-96d5-f3f83e53a3ed	df1d0ba0-a668-4cc4-8dce-85e0f1f19a11	Machining	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38e4-720e-a1aa-680244d6c930	df1d0ba0-a668-4cc4-8dce-85e0f1f19a11	Hardening	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38e5-725a-8ad5-cdd28a2af266	df1d0ba0-a668-4cc4-8dce-85e0f1f19a11	Grinding	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38e5-725a-8ad5-cdd28a79ff2b	df1d0ba0-a668-4cc4-8dce-85e0f1f19a11	Wirecut	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38e6-70e0-9402-7656b17b3102	df1d0ba0-a668-4cc4-8dce-85e0f1f19a11	Assembly	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38e8-7190-a386-193c65a78eaf	d152d09b-cc91-4a8e-9c69-c5b40ac94c02	Material	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38e9-7091-ab65-1a9ed74f5b4b	d152d09b-cc91-4a8e-9c69-c5b40ac94c02	Arrival	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38ea-70ae-a504-87f9a98e0526	d152d09b-cc91-4a8e-9c69-c5b40ac94c02	Machining	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38ea-70ae-a504-87f9a9f7f83b	d152d09b-cc91-4a8e-9c69-c5b40ac94c02	Hardening	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38eb-73d6-9201-abf8524fbde3	d152d09b-cc91-4a8e-9c69-c5b40ac94c02	Grinding	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38ec-71e3-89be-013c6d21c773	d152d09b-cc91-4a8e-9c69-c5b40ac94c02	Wirecut	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38ed-7060-b984-2bbb09d8c7a4	d152d09b-cc91-4a8e-9c69-c5b40ac94c02	Assembly	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38f0-7065-84cb-8948ae6e1b6a	45517df5-32c5-4ff5-8879-af2e23bad3c6	Material	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38f1-71b0-b3b5-ec0cfa1c72fc	45517df5-32c5-4ff5-8879-af2e23bad3c6	Arrival	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38f2-7360-84a3-eb2edd9a2438	45517df5-32c5-4ff5-8879-af2e23bad3c6	Machining	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38f3-725f-a3b9-c8a59293cb6a	45517df5-32c5-4ff5-8879-af2e23bad3c6	Hardening	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38f4-71c6-b162-20abf3556254	45517df5-32c5-4ff5-8879-af2e23bad3c6	Grinding	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38f5-70cd-bf46-971d9680218b	45517df5-32c5-4ff5-8879-af2e23bad3c6	Wirecut	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38f5-70cd-bf46-971d9773c04f	45517df5-32c5-4ff5-8879-af2e23bad3c6	Assembly	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38f7-70a6-93a7-8c653d9a85c7	0cb05da8-fbfc-437a-ab8c-a20e9fdb22b4	Material	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38f8-7074-b428-67eea5ea24bd	0cb05da8-fbfc-437a-ab8c-a20e9fdb22b4	Arrival	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38f8-7074-b428-67eea68c18e1	0cb05da8-fbfc-437a-ab8c-a20e9fdb22b4	Machining	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38f9-717c-8f4d-f09042e30a72	0cb05da8-fbfc-437a-ab8c-a20e9fdb22b4	Hardening	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38fa-70dc-93b1-4238e9e48281	0cb05da8-fbfc-437a-ab8c-a20e9fdb22b4	Grinding	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0e6a2-ec7f-73fe-ae7d-a191957d9ea9	afdba3e1-2ee5-48c2-93f0-841d90836ea4	Material	Done		\N	\N	2026-09-28 06:10:32	2026-09-28 06:32:39
01a0e6a2-ec80-72ad-be1e-495674bb5c32	afdba3e1-2ee5-48c2-93f0-841d90836ea4	Arrival	Done		\N	\N	2026-09-28 06:10:32	2026-09-28 06:32:41
01a0e6a2-ec9d-7165-9c94-ee084e3d7517	52cd700c-70b3-4878-b80f-beea372e835a	Arrival	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 06:15:10
01a0e6a2-ec92-70e7-811c-a0238a592d2b	9f8d9795-98f2-44ae-98f4-ca89e30d8be9	Material	Done		\N	\N	2026-09-28 06:10:32	2026-09-28 06:33:32
01a0e6a2-ec93-7154-bfdd-e58c9566a4f2	9f8d9795-98f2-44ae-98f4-ca89e30d8be9	Arrival	Done		\N	\N	2026-09-28 06:10:32	2026-09-28 06:33:34
01a0e6a2-ec94-7052-b4c7-cccfedddf68e	9f8d9795-98f2-44ae-98f4-ca89e30d8be9	Machining	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:33:40
01a0e6a2-eca6-7248-b295-9d8f64c61854	6a5ba01a-21bf-41bb-aad2-a2d038ccbfac	Material	Done		\N	\N	2026-09-28 06:10:32	2026-09-28 06:34:16
01a0e6a2-eca7-7018-8636-a9dcddc544cc	6a5ba01a-21bf-41bb-aad2-a2d038ccbfac	Arrival	Done		\N	\N	2026-09-28 06:10:32	2026-09-28 06:34:19
01a0e6a2-eca8-73a8-a7bf-3da7bba7bd4a	6a5ba01a-21bf-41bb-aad2-a2d038ccbfac	Machining	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:34:22
01a0e6a2-ec9c-70f7-9061-d08c017c7624	52cd700c-70b3-4878-b80f-beea372e835a	Material	Done		\N	\N	2026-09-28 06:10:32	2026-09-28 06:35:11
01a0e6a2-ec9e-7344-b483-f89c49b1e76f	52cd700c-70b3-4878-b80f-beea372e835a	Machining	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:35:16
01a0e6a2-ec6b-7083-8177-f4dc41f92f2e	f698a227-ba55-403f-ae7b-df910acb54e4	Material	Done		\N	\N	2026-09-28 06:10:32	2026-09-28 06:36:03
01a0e6a2-ec6c-7074-b7cc-39a681183b01	f698a227-ba55-403f-ae7b-df910acb54e4	Arrival	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 06:15:10
01a0e6a2-ec75-7295-a7a0-d443cb6d0044	503d6a55-e111-471e-8174-a4d380da26ed	Material	Done		\N	\N	2026-09-28 06:10:32	2026-09-28 06:36:57
01a0e6a2-ec76-7093-9866-eac57ab882a2	503d6a55-e111-471e-8174-a4d380da26ed	Arrival	Done		\N	\N	2026-09-28 06:10:32	2026-09-28 06:36:59
01a0e6a2-ec89-72d8-b60c-ff9a1186a9d4	cac7ff99-9be1-49a7-bc58-5abe3d381c15	Arrival	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 06:15:10
01a0e6a2-ec88-7387-b82d-9480e718c963	cac7ff99-9be1-49a7-bc58-5abe3d381c15	Material	Done		\N	\N	2026-09-28 06:10:32	2026-09-28 06:38:41
01a0f13d-38fa-70dc-93b1-4238ea336f62	0cb05da8-fbfc-437a-ab8c-a20e9fdb22b4	Wirecut	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0e6a2-ec66-71ee-948e-4af114c860a6	36dc892a-1a16-4413-a095-e54a75acfb0c	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ec67-72c7-9f31-ddeec2950f16	36dc892a-1a16-4413-a095-e54a75acfb0c	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ec69-7088-b128-474b3804b6ea	36dc892a-1a16-4413-a095-e54a75acfb0c	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0f13d-38fb-72c5-9e7c-abfa08c3da45	0cb05da8-fbfc-437a-ab8c-a20e9fdb22b4	Assembly	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38fd-730e-9af2-9c1d405bfc38	fa95f059-ec62-4a6f-b22b-443dde63f0c5	Material	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38fe-71a9-af7e-b708dca382ac	fa95f059-ec62-4a6f-b22b-443dde63f0c5	Arrival	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-38ff-71f4-8a7c-80f2fe51dc70	fa95f059-ec62-4a6f-b22b-443dde63f0c5	Machining	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-3900-7178-99cb-5b95b0408040	fa95f059-ec62-4a6f-b22b-443dde63f0c5	Hardening	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-3901-7278-bec0-416064f3b96e	fa95f059-ec62-4a6f-b22b-443dde63f0c5	Grinding	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0e6a2-ec6f-71f1-a40f-f6dd30db2f1a	f698a227-ba55-403f-ae7b-df910acb54e4	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ec70-7351-b947-5cde879e022d	f698a227-ba55-403f-ae7b-df910acb54e4	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ec71-7161-b147-b2cf6402b92c	f698a227-ba55-403f-ae7b-df910acb54e4	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ec72-701a-9b8b-5c6b61e52285	f698a227-ba55-403f-ae7b-df910acb54e4	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0f13d-3902-704c-8635-ae713c500255	fa95f059-ec62-4a6f-b22b-443dde63f0c5	Wirecut	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-3902-704c-8635-ae713cb1f811	fa95f059-ec62-4a6f-b22b-443dde63f0c5	Assembly	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-3904-7218-9858-73290ad11ff1	cf4dda31-9692-42c7-b213-d15834fbc72e	Material	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0e6a2-ec79-70fe-9c9e-7d0885e69db1	503d6a55-e111-471e-8174-a4d380da26ed	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ec7a-70af-8969-fb51d62d906a	503d6a55-e111-471e-8174-a4d380da26ed	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ec7b-71c2-837d-1304dbd8d50e	503d6a55-e111-471e-8174-a4d380da26ed	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ec7c-733d-a415-9d26bc720685	503d6a55-e111-471e-8174-a4d380da26ed	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0f13d-3905-724e-afc6-a8170248631c	cf4dda31-9692-42c7-b213-d15834fbc72e	Arrival	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-3906-7157-b580-77ed512c7e81	cf4dda31-9692-42c7-b213-d15834fbc72e	Machining	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-3906-7157-b580-77ed51746ac4	cf4dda31-9692-42c7-b213-d15834fbc72e	Hardening	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0e6a2-ec82-711e-8fdd-ad777a017082	afdba3e1-2ee5-48c2-93f0-841d90836ea4	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ec83-71fc-b446-34f25c7783ce	afdba3e1-2ee5-48c2-93f0-841d90836ea4	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ec85-707e-8684-9885874aec96	afdba3e1-2ee5-48c2-93f0-841d90836ea4	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ec86-7235-b491-03790f9f549b	afdba3e1-2ee5-48c2-93f0-841d90836ea4	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0f13d-3907-72af-a74d-9a683c945b9f	cf4dda31-9692-42c7-b213-d15834fbc72e	Grinding	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-3908-7303-b157-41b628717d6b	cf4dda31-9692-42c7-b213-d15834fbc72e	Wirecut	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-3909-70e0-945e-23cbdccdd373	cf4dda31-9692-42c7-b213-d15834fbc72e	Assembly	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0e6a2-ec8c-7015-9181-dd54db6e38eb	cac7ff99-9be1-49a7-bc58-5abe3d381c15	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ec8d-72ee-8a2a-9e8d90f1c8a6	cac7ff99-9be1-49a7-bc58-5abe3d381c15	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ec8e-7320-ac61-c4e7d8b7d732	cac7ff99-9be1-49a7-bc58-5abe3d381c15	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ec8f-720e-ae81-3a16099c6037	cac7ff99-9be1-49a7-bc58-5abe3d381c15	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0f13d-390a-733e-a0f0-845b25cdd99a	6f1b08f9-5916-484a-ac1d-c00bae77681b	Material	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-390b-7291-bcb4-ca351aff3d5c	6f1b08f9-5916-484a-ac1d-c00bae77681b	Arrival	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-390b-7291-bcb4-ca351ba400f4	6f1b08f9-5916-484a-ac1d-c00bae77681b	Machining	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0e6a2-ec95-7301-b6f3-b7ea9b63a792	9f8d9795-98f2-44ae-98f4-ca89e30d8be9	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ec97-70cb-a7a3-48847e81d636	9f8d9795-98f2-44ae-98f4-ca89e30d8be9	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ec98-7317-beae-16f81c00536e	9f8d9795-98f2-44ae-98f4-ca89e30d8be9	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ec99-7129-92ba-14faef3e620e	9f8d9795-98f2-44ae-98f4-ca89e30d8be9	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0f13d-390c-703c-b562-13183d4acf71	6f1b08f9-5916-484a-ac1d-c00bae77681b	Hardening	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-390d-7029-8ce7-bad232d1bf48	6f1b08f9-5916-484a-ac1d-c00bae77681b	Grinding	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-390d-7029-8ce7-bad232dc98a1	6f1b08f9-5916-484a-ac1d-c00bae77681b	Wirecut	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0e6a2-ec9f-735a-b121-55ed8736238a	52cd700c-70b3-4878-b80f-beea372e835a	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-eca1-7150-9a0a-b8b2f63dd8b5	52cd700c-70b3-4878-b80f-beea372e835a	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-eca2-7332-9369-78800b6bfda1	52cd700c-70b3-4878-b80f-beea372e835a	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-eca3-73d3-b60b-b7ab6f44ca4e	52cd700c-70b3-4878-b80f-beea372e835a	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0f13d-390e-737e-8d19-8037e9a0b2c7	6f1b08f9-5916-484a-ac1d-c00bae77681b	Assembly	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-3910-71a2-91dd-163ddd908293	df97c2fa-9638-4605-903b-aee165fac6c2	Material	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0e6a2-eca9-7076-a1b2-a5f95a29a7fe	6a5ba01a-21bf-41bb-aad2-a2d038ccbfac	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecaa-71de-ae10-225861fce4dc	6a5ba01a-21bf-41bb-aad2-a2d038ccbfac	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecab-721b-a38c-55d4215b7e20	6a5ba01a-21bf-41bb-aad2-a2d038ccbfac	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecad-7086-a3e7-5b0f2180e97f	6a5ba01a-21bf-41bb-aad2-a2d038ccbfac	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecaf-73e6-98c8-172ea6e36b53	177b954d-7956-4601-a7de-51c0171533a9	Material	Done		\N	\N	2026-09-28 06:10:32	2026-09-28 06:42:34
01a0e6a2-ec8b-73ce-a4c2-99bd79bca459	cac7ff99-9be1-49a7-bc58-5abe3d381c15	Machining	In Progress		2026-09-29 07:08:07	\N	2026-09-28 06:10:32	2026-09-29 07:08:07
01a0e6a2-ec81-7295-9d8b-2bf70091f505	afdba3e1-2ee5-48c2-93f0-841d90836ea4	Machining	In Progress		2026-09-29 07:08:09	\N	2026-09-28 06:10:32	2026-09-29 07:08:09
01a0e6a2-ec77-7180-8754-c365efaa64b7	503d6a55-e111-471e-8174-a4d380da26ed	Machining	In Progress		2026-09-29 07:08:12	\N	2026-09-28 06:10:32	2026-09-29 07:08:12
01a0e6a2-ecd6-738f-833b-5d65984bc36e	2b29e893-fe7f-4c5d-9d95-af0939452d93	Material	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 03:00:03
01a0e6a2-ecd8-71e1-bc27-616b86543fcf	2b29e893-fe7f-4c5d-9d95-af0939452d93	Arrival	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 03:00:06
01a0e6a2-ecb3-72af-af71-6a3b0f2a0e69	177b954d-7956-4601-a7de-51c0171533a9	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecb4-737f-809a-4d132c6c43d3	177b954d-7956-4601-a7de-51c0171533a9	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecb5-72a1-bda4-bc258622ebeb	177b954d-7956-4601-a7de-51c0171533a9	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecb6-73ee-91ec-60489d9fa629	177b954d-7956-4601-a7de-51c0171533a9	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ece0-712f-ba62-a5658b196c4f	7c4f6300-c3b3-4162-954e-15687df523f3	Material	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 03:22:35
01a0e6a2-ece1-73ce-aa5b-ddc3dfa694a9	7c4f6300-c3b3-4162-954e-15687df523f3	Arrival	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 03:22:36
01a0e6a2-ecbd-724f-b172-6fdb69f16c7e	9ef3823d-c8c6-4a47-9ec7-bbcbf4be5cda	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecbf-7064-b034-f8a86ebdfb30	9ef3823d-c8c6-4a47-9ec7-bbcbf4be5cda	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecc1-72c8-9272-94bd451020f9	9ef3823d-c8c6-4a47-9ec7-bbcbf4be5cda	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ece2-731b-89a4-79506c421736	7c4f6300-c3b3-4162-954e-15687df523f3	Machining	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 04:09:10
01a0e6a2-ecbb-70f0-be71-479b083137e2	9ef3823d-c8c6-4a47-9ec7-bbcbf4be5cda	Machining	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 04:14:14
01a0e6a2-ecc6-70bd-8a94-599ff2acfedc	817f248e-5c37-49e9-98cd-1be2ee327184	Machining	Done		2026-09-29 07:12:40	\N	2026-09-28 06:10:32	2026-09-30 04:14:22
01a0e6a2-ecc7-7320-8656-5bdac76a12a7	817f248e-5c37-49e9-98cd-1be2ee327184	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecc9-70c7-93c5-9f6f125532d4	817f248e-5c37-49e9-98cd-1be2ee327184	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecca-72a8-b4e0-97527af9254c	817f248e-5c37-49e9-98cd-1be2ee327184	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecd2-70ae-aa14-14fce38e8a9f	6196d091-466f-4fbb-9380-a091f92fbba1	Grinding	Done		2026-09-28 06:46:16	\N	2026-09-28 06:10:32	2026-09-29 05:53:00
01a0e6a2-ecc8-71e6-96fa-fb8ebd618857	817f248e-5c37-49e9-98cd-1be2ee327184	Grinding	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 04:14:45
01a0e6a2-ecd9-727e-88f3-d5ea91516ed9	2b29e893-fe7f-4c5d-9d95-af0939452d93	Machining	In Progress		2026-09-30 03:00:11	\N	2026-09-28 06:10:32	2026-09-30 04:39:44
01a0e6a2-ecd0-731e-b800-1a8ed34f460c	6196d091-466f-4fbb-9380-a091f92fbba1	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecb2-727e-b402-36c041df098b	177b954d-7956-4601-a7de-51c0171533a9	Machining	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 04:50:32
01a0e6a2-eccf-7282-bceb-42967b6866af	6196d091-466f-4fbb-9380-a091f92fbba1	Machining	Done		2026-09-29 07:12:27	\N	2026-09-28 06:10:32	2026-09-30 04:50:44
01a0e6a2-ecba-7015-a506-178b8a89453f	9ef3823d-c8c6-4a47-9ec7-bbcbf4be5cda	Arrival	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 06:15:10
01a0e6a2-ecd3-7077-8d2a-16df285b43af	6196d091-466f-4fbb-9380-a091f92fbba1	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecd4-7396-baef-eeaa126e5892	6196d091-466f-4fbb-9380-a091f92fbba1	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecc4-732a-9648-4a70936a9d4e	817f248e-5c37-49e9-98cd-1be2ee327184	Arrival	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 06:15:10
01a0e6a2-ecb0-713c-943b-4c715bbddddd	177b954d-7956-4601-a7de-51c0171533a9	Arrival	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 06:15:10
01a0e6a2-ecce-70fe-b14a-30c50c0c14ac	6196d091-466f-4fbb-9380-a091f92fbba1	Arrival	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 06:15:10
01a0f13d-3911-718b-b30c-4ad7ec9d86cf	df97c2fa-9638-4605-903b-aee165fac6c2	Arrival	Not Started		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-3912-7074-8f09-30102d370a16	df97c2fa-9638-4605-903b-aee165fac6c2	Machining	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-3912-7074-8f09-30102d3bc229	df97c2fa-9638-4605-903b-aee165fac6c2	Hardening	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0e6a2-ecda-7179-bc75-16fe96d2db0e	2b29e893-fe7f-4c5d-9d95-af0939452d93	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecdb-709e-b807-32ccf8fa8b8b	2b29e893-fe7f-4c5d-9d95-af0939452d93	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecdc-7147-af55-4f795f19e183	2b29e893-fe7f-4c5d-9d95-af0939452d93	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0f13d-3913-72d0-b844-b0b9aa3af1c9	df97c2fa-9638-4605-903b-aee165fac6c2	Grinding	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-3914-7252-88be-0145329d8163	df97c2fa-9638-4605-903b-aee165fac6c2	Wirecut	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0f13d-3914-7252-88be-01453386f957	df97c2fa-9638-4605-903b-aee165fac6c2	Assembly	-		\N	\N	2026-09-30 07:35:16	2026-09-30 07:35:16
01a0e6a2-ecde-7096-8e4f-8029c661e90f	2b29e893-fe7f-4c5d-9d95-af0939452d93	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0f164-5f0d-72a5-8b91-8db3606da3e0	ef51fa11-3d2d-43bf-9b19-fa828e3f6b28	Arrival	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f0f-737c-8ac8-2876d4ed2002	ef51fa11-3d2d-43bf-9b19-fa828e3f6b28	Machining	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f10-72b8-a77b-dc5fbcd11199	ef51fa11-3d2d-43bf-9b19-fa828e3f6b28	Hardening	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f11-7126-aef5-8361181a9d75	ef51fa11-3d2d-43bf-9b19-fa828e3f6b28	Grinding	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f12-726b-a13c-eaad2317bbfe	ef51fa11-3d2d-43bf-9b19-fa828e3f6b28	Wirecut	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f13-714e-8063-9470a4037d82	ef51fa11-3d2d-43bf-9b19-fa828e3f6b28	Assembly	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0e6a2-ece3-7015-86da-f9320c961d2b	7c4f6300-c3b3-4162-954e-15687df523f3	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0f164-5f15-728b-87c4-b6239df57964	9eca8e61-bc8e-4797-9403-32a429a89c14	Material	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0e6a2-ecc3-733e-88b3-b5e8dfef035a	817f248e-5c37-49e9-98cd-1be2ee327184	Material	Done		\N	\N	2026-09-28 06:10:32	2026-09-28 06:41:45
01a0f164-5f17-71b3-bd1c-5a1c23c279de	9eca8e61-bc8e-4797-9403-32a429a89c14	Arrival	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f18-7271-b26f-05eb4d51e3cf	9eca8e61-bc8e-4797-9403-32a429a89c14	Machining	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f19-73bd-9ef7-be12f48aac54	9eca8e61-bc8e-4797-9403-32a429a89c14	Hardening	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f1a-71cb-ad80-35bbd5301ee0	9eca8e61-bc8e-4797-9403-32a429a89c14	Grinding	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f1b-7062-be36-8920cedc36a5	9eca8e61-bc8e-4797-9403-32a429a89c14	Wirecut	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f1c-7029-b2a2-9420e39830e3	9eca8e61-bc8e-4797-9403-32a429a89c14	Assembly	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f1e-70c7-a496-8669d5f2ed28	a2621639-6cce-401f-8fcd-6ac47cdb91c7	Material	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0e6a2-eccd-7304-8d7c-a404e66bf970	6196d091-466f-4fbb-9380-a091f92fbba1	Material	Done		\N	\N	2026-09-28 06:10:32	2026-09-28 06:45:19
01a0f164-5f1f-7217-819c-01293902ab62	a2621639-6cce-401f-8fcd-6ac47cdb91c7	Arrival	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f20-7374-9ffd-e1db0759b8f6	a2621639-6cce-401f-8fcd-6ac47cdb91c7	Machining	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f21-72c5-9cc7-b46ea0a84be8	a2621639-6cce-401f-8fcd-6ac47cdb91c7	Hardening	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f22-71b3-a762-430f2d1e30be	a2621639-6cce-401f-8fcd-6ac47cdb91c7	Grinding	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f23-736a-b05e-3c85f9957700	a2621639-6cce-401f-8fcd-6ac47cdb91c7	Wirecut	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f24-7151-8fd9-f18ab80792f3	a2621639-6cce-401f-8fcd-6ac47cdb91c7	Assembly	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f27-70b7-8992-ee589bfd260a	696e3003-c755-4f9f-971b-5fbce50af198	Material	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f29-736d-bfa2-b1632a671c4f	696e3003-c755-4f9f-971b-5fbce50af198	Arrival	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f2a-738f-a5b0-2dcfd56a27d8	696e3003-c755-4f9f-971b-5fbce50af198	Machining	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f2a-738f-a5b0-2dcfd58ca803	696e3003-c755-4f9f-971b-5fbce50af198	Hardening	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f2b-720c-8a50-58a27c516c43	696e3003-c755-4f9f-971b-5fbce50af198	Grinding	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f2c-720f-a379-2af051a4e6d8	696e3003-c755-4f9f-971b-5fbce50af198	Wirecut	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f2d-7226-8eac-c492c9ed7f1f	696e3003-c755-4f9f-971b-5fbce50af198	Assembly	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f2f-734a-8f19-7340e1bc1a3b	fe6643e6-51f0-4cff-a8e9-b22225d6ff38	Material	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0e6a2-ecbe-701c-ae9f-914091611cf3	9ef3823d-c8c6-4a47-9ec7-bbcbf4be5cda	Grinding	Done		\N	\N	2026-09-28 06:10:32	2026-10-01 02:01:48
01a0e6a2-ece4-723f-abaf-5b51c053215e	7c4f6300-c3b3-4162-954e-15687df523f3	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ece8-71ad-ac06-3f40cec4382d	da7fd30f-070a-4709-acf1-26d8cc3f2377	Material	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 04:38:15
01a0e6a2-ece8-71ad-ac06-3f40cf67d7b6	da7fd30f-070a-4709-acf1-26d8cc3f2377	Arrival	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 04:38:17
01a0e6a2-ece9-71a2-882a-527b64b7ecb8	da7fd30f-070a-4709-acf1-26d8cc3f2377	Machining	Done		\N	\N	2026-09-28 06:10:32	2026-09-30 04:38:53
01a0f164-5f31-70b0-9be1-fbc72c741eb4	fe6643e6-51f0-4cff-a8e9-b22225d6ff38	Arrival	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f32-71fb-b11d-8f00e33c2d61	fe6643e6-51f0-4cff-a8e9-b22225d6ff38	Machining	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f33-73f7-a5f9-e71fc96ad763	fe6643e6-51f0-4cff-a8e9-b22225d6ff38	Hardening	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f34-7238-8419-45ff22a8c0ee	fe6643e6-51f0-4cff-a8e9-b22225d6ff38	Grinding	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f35-700a-b352-1b5018244bb4	fe6643e6-51f0-4cff-a8e9-b22225d6ff38	Wirecut	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f36-7057-bbdc-a92434b423db	fe6643e6-51f0-4cff-a8e9-b22225d6ff38	Assembly	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f39-7314-a350-0ebda446bc71	41ea2782-50dd-4558-a5ba-9a6b76b8b0a6	Material	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f3a-7061-971a-6928b12d2f0f	41ea2782-50dd-4558-a5ba-9a6b76b8b0a6	Arrival	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f3b-7363-8cbd-67b21cfe58ce	41ea2782-50dd-4558-a5ba-9a6b76b8b0a6	Machining	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f3c-7358-babb-b9e5f21f305e	41ea2782-50dd-4558-a5ba-9a6b76b8b0a6	Hardening	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f3d-723b-83a0-aebd87e40f6d	41ea2782-50dd-4558-a5ba-9a6b76b8b0a6	Grinding	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f3e-7210-b0b9-5ac93753ffe7	41ea2782-50dd-4558-a5ba-9a6b76b8b0a6	Wirecut	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f3f-711c-949c-10c4eb9188ae	41ea2782-50dd-4558-a5ba-9a6b76b8b0a6	Assembly	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f41-7207-927a-5af86b7c0446	605db17f-f07c-4750-9a7b-f75d69750b07	Material	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f42-70eb-8131-0f0b03a80e55	605db17f-f07c-4750-9a7b-f75d69750b07	Arrival	Not Started		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f43-71ca-a491-f2e8a1fe07b9	605db17f-f07c-4750-9a7b-f75d69750b07	Machining	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0e6a2-ece5-72e6-8f40-9978ee7ba17a	7c4f6300-c3b3-4162-954e-15687df523f3	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0f164-5f44-72a6-a0c7-3896fb8a7b9d	605db17f-f07c-4750-9a7b-f75d69750b07	Hardening	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f46-70f9-8ea1-9270206c31b0	605db17f-f07c-4750-9a7b-f75d69750b07	Grinding	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f164-5f46-70f9-8ea1-927020d675d1	605db17f-f07c-4750-9a7b-f75d69750b07	Wirecut	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0e6a2-ece6-72b3-8203-ffd10ff42830	7c4f6300-c3b3-4162-954e-15687df523f3	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0f164-5f47-71f5-99a7-58a23629c919	605db17f-f07c-4750-9a7b-f75d69750b07	Assembly	-		\N	\N	2026-09-30 08:18:02	2026-09-30 08:18:02
01a0f165-8056-70ee-abfe-898f63caab14	78ee738f-5994-4db3-ac25-994effe2253e	Arrival	Not Started		\N	\N	2026-09-30 08:19:16	2026-09-30 08:19:16
01a0f165-805a-702a-9f2d-bf3fe7c1cb13	386513b8-3a03-49b2-9d26-be9e8c4925f5	PO	Not Started		\N	\N	2026-09-30 08:19:16	2026-09-30 08:19:16
01a0e6a2-ecea-71df-9262-64e7cf2a1693	da7fd30f-070a-4709-acf1-26d8cc3f2377	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-eceb-71c8-850d-24cef556afa4	da7fd30f-070a-4709-acf1-26d8cc3f2377	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecec-7364-8d7c-0c727f789a0a	da7fd30f-070a-4709-acf1-26d8cc3f2377	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-eced-7159-9951-6440fc80b22a	da7fd30f-070a-4709-acf1-26d8cc3f2377	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0f165-805b-7028-a5ae-be50066797b5	386513b8-3a03-49b2-9d26-be9e8c4925f5	Arrival	Not Started		\N	\N	2026-09-30 08:19:16	2026-09-30 08:19:16
01a0f165-805e-713e-ad3b-10372492c641	494a6ad7-edbf-4677-a0c0-7c123689f57e	PO	Not Started		\N	\N	2026-09-30 08:19:16	2026-09-30 08:19:16
01a0f165-805f-73c7-b772-de835858e198	494a6ad7-edbf-4677-a0c0-7c123689f57e	Arrival	Not Started		\N	\N	2026-09-30 08:19:16	2026-09-30 08:19:16
01a0e6a2-ecef-7062-90f3-492add68cc21	396e0856-ee18-4de1-86ad-e5e34459f404	Material	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecef-7062-90f3-492add863892	396e0856-ee18-4de1-86ad-e5e34459f404	Arrival	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecf0-7124-b4e9-0dd2ff59b88a	396e0856-ee18-4de1-86ad-e5e34459f404	Machining	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecf1-709c-a579-44d9408f56a6	396e0856-ee18-4de1-86ad-e5e34459f404	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a4-f1bd-7147-846b-5b9f91800112	b3b35750-af26-4563-a308-51ac1c6344b0	Arrival	Done		2026-09-30 03:44:53	2026-10-01	2026-09-28 06:12:44	2026-10-01 03:48:43
01a0e6a2-ecf2-737f-a314-f95c73e9984e	396e0856-ee18-4de1-86ad-e5e34459f404	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0f144-8f95-70f9-a8af-4676a5b88ca0	543f006d-0411-4f51-8c96-a49b97482346	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a2-ecf7-71f1-b9ba-1e44906a82e2	e953e46f-9b7c-4472-b54f-5b655218d956	Machining	Done		2026-09-28 06:29:04	\N	2026-09-28 06:10:32	2026-09-29 05:53:16
01a0e6a2-ecf3-73b8-824a-46df54fb61db	396e0856-ee18-4de1-86ad-e5e34459f404	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecf3-73b8-824a-46df55e8c2d0	396e0856-ee18-4de1-86ad-e5e34459f404	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecfb-71ca-bcc4-fc09ac84bb22	f9a84bdd-15c6-49a0-b3c1-be633be4ec1b	Material	Done		\N	\N	2026-09-28 06:10:32	2026-09-29 05:53:32
01a0e6a2-ecfc-711b-b944-37139fb7ec58	f9a84bdd-15c6-49a0-b3c1-be633be4ec1b	Arrival	Done		\N	\N	2026-09-28 06:10:32	2026-09-29 05:53:34
01a0e6a5-d83f-7018-bcfa-c1fea7916da1	cfa9cb0f-804a-47a2-9d4f-4099d5b79497	Arrival	Done		2026-09-29 01:54:26	2026-09-25	2026-09-28 06:13:43	2026-09-30 02:56:41
01a0e6a2-ecf8-70e5-a17b-65a6cf67dc74	e953e46f-9b7c-4472-b54f-5b655218d956	Hardening	In Progress SC		2026-09-30 02:59:40	\N	2026-09-28 06:10:32	2026-09-30 02:59:40
01a0e6a2-ecfd-7388-88e0-17ccdfbf6f2c	f9a84bdd-15c6-49a0-b3c1-be633be4ec1b	Machining	Done		2026-09-29 05:53:47	\N	2026-09-28 06:10:32	2026-09-29 05:53:52
01a0f144-8f99-72a5-bdfa-32505f68dd70	543f006d-0411-4f51-8c96-a49b97482346	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8f9a-7379-a4a2-e16396df1b1f	543f006d-0411-4f51-8c96-a49b97482346	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a2-ecf8-70e5-a17b-65a6cf72aeb7	e953e46f-9b7c-4472-b54f-5b655218d956	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecf9-71ff-a221-c3770370fa6c	e953e46f-9b7c-4472-b54f-5b655218d956	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecfa-72a2-9f02-26d8e951454b	e953e46f-9b7c-4472-b54f-5b655218d956	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0f144-8f9b-7173-b2b7-4426b0a25649	543f006d-0411-4f51-8c96-a49b97482346	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8f9c-71e8-a66f-af72bfc9420b	543f006d-0411-4f51-8c96-a49b97482346	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8f9d-7153-9cbf-c685f99e56a9	543f006d-0411-4f51-8c96-a49b97482346	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8f9e-7371-a271-ed4dec4b803e	543f006d-0411-4f51-8c96-a49b97482346	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a2-ed00-7196-8cd3-c79969641a9d	f9a84bdd-15c6-49a0-b3c1-be633be4ec1b	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed01-7256-a355-cd0a1627ad8b	f9a84bdd-15c6-49a0-b3c1-be633be4ec1b	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed02-706c-9d9a-164b2646c9b3	f9a84bdd-15c6-49a0-b3c1-be633be4ec1b	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed04-710c-b9a2-333887d2a00e	8932b698-e137-422c-ae4b-143bdfbd2333	Material	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed05-71ff-be9a-dc75bce070c4	8932b698-e137-422c-ae4b-143bdfbd2333	Arrival	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed06-73ab-aaf9-ae020ff5e01b	8932b698-e137-422c-ae4b-143bdfbd2333	Machining	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed07-71f2-935c-d6c0635a7408	8932b698-e137-422c-ae4b-143bdfbd2333	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed08-707f-9b65-5761fb82a6c3	8932b698-e137-422c-ae4b-143bdfbd2333	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed09-704a-8bc6-9c329db595e0	8932b698-e137-422c-ae4b-143bdfbd2333	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed0a-7094-abe4-df246a62bfb0	8932b698-e137-422c-ae4b-143bdfbd2333	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed0c-71f9-ac90-7c1ce03f5562	3ab5d794-bd6d-431d-ad61-57379487e3ac	Material	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed0d-7001-919d-7906cc7c5e6e	3ab5d794-bd6d-431d-ad61-57379487e3ac	Arrival	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed0e-7234-a04a-0b8f6f751bf7	3ab5d794-bd6d-431d-ad61-57379487e3ac	Machining	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed0f-72cc-9ae0-cad990ce159b	3ab5d794-bd6d-431d-ad61-57379487e3ac	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed10-7188-922f-9920955bbd47	3ab5d794-bd6d-431d-ad61-57379487e3ac	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed11-70cd-985f-485ae74f30af	3ab5d794-bd6d-431d-ad61-57379487e3ac	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed12-7323-a8a6-a49f7b4bec1c	3ab5d794-bd6d-431d-ad61-57379487e3ac	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed14-70b1-aaa8-ee6b79a3c33a	81977c8e-7cf1-4bdc-bbce-f72c9a1e000b	Material	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed15-735a-8dba-5ce6c6f1e97d	81977c8e-7cf1-4bdc-bbce-f72c9a1e000b	Arrival	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed17-71ae-a39b-6325818139d3	81977c8e-7cf1-4bdc-bbce-f72c9a1e000b	Machining	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed18-7190-9910-15927e396410	81977c8e-7cf1-4bdc-bbce-f72c9a1e000b	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed19-71d9-a654-565d32d68897	81977c8e-7cf1-4bdc-bbce-f72c9a1e000b	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed1a-70e0-b412-97a6396b69e5	81977c8e-7cf1-4bdc-bbce-f72c9a1e000b	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed1b-7234-8ee7-c7dc1d571c9b	81977c8e-7cf1-4bdc-bbce-f72c9a1e000b	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed1d-72bf-8ff9-630d0cdc7997	dfe83c86-4089-4b3e-a180-96fe9ca100a7	Material	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed1e-7352-ae00-b7c3e4ae68b4	dfe83c86-4089-4b3e-a180-96fe9ca100a7	Arrival	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed1f-73de-bb6d-10df16c905a5	dfe83c86-4089-4b3e-a180-96fe9ca100a7	Machining	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed21-7374-bc91-f7e0d05f1c6e	dfe83c86-4089-4b3e-a180-96fe9ca100a7	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed21-7374-bc91-f7e0d078d044	dfe83c86-4089-4b3e-a180-96fe9ca100a7	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed22-736b-a565-df282fc027bd	dfe83c86-4089-4b3e-a180-96fe9ca100a7	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed23-71c8-adc5-0cb587696626	dfe83c86-4089-4b3e-a180-96fe9ca100a7	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed25-711d-8722-d1253c80406c	1c56a718-c766-41bd-98e1-c9dcf6769c69	Material	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed26-7189-b320-52cc3de1ab2a	1c56a718-c766-41bd-98e1-c9dcf6769c69	Arrival	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed27-7207-b663-a5839875987c	1c56a718-c766-41bd-98e1-c9dcf6769c69	Machining	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed28-7396-abd3-6271970e3803	1c56a718-c766-41bd-98e1-c9dcf6769c69	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed29-7364-b64e-a38c26d136aa	1c56a718-c766-41bd-98e1-c9dcf6769c69	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed2a-7149-b0e9-d65f1f4cd4db	1c56a718-c766-41bd-98e1-c9dcf6769c69	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed2b-7336-9754-49e0dfe9ecaa	1c56a718-c766-41bd-98e1-c9dcf6769c69	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed2d-7279-a3de-ad47de2b2919	01e7ad73-9069-4bae-87c9-3e728d94bf12	Material	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed2e-700e-96bf-93e3ee803d65	01e7ad73-9069-4bae-87c9-3e728d94bf12	Arrival	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed2f-7289-9764-5aa4383905f3	01e7ad73-9069-4bae-87c9-3e728d94bf12	Machining	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed30-70f0-b2fb-9edff263cf2b	01e7ad73-9069-4bae-87c9-3e728d94bf12	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed31-70a9-8b61-740ecb7baf58	01e7ad73-9069-4bae-87c9-3e728d94bf12	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed32-732d-bc26-accc8a4076c7	01e7ad73-9069-4bae-87c9-3e728d94bf12	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed32-732d-bc26-accc8a788a51	01e7ad73-9069-4bae-87c9-3e728d94bf12	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed34-72ee-8f25-a2afeea28960	8ee09056-ecda-49da-9447-5d2e1253466e	Material	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ecf6-7289-9212-58996e9743a5	e953e46f-9b7c-4472-b54f-5b655218d956	Arrival	Done		\N	\N	2026-09-28 06:10:32	2026-09-28 06:28:47
01a0f144-8fa1-71ee-91cf-15b275a268aa	81b8af3c-8ad4-40c9-9a64-d7ba0a5b5a90	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a2-ecfe-70e7-921b-a7ff021121a2	f9a84bdd-15c6-49a0-b3c1-be633be4ec1b	Hardening	In Progress		2026-09-29 05:54:05	\N	2026-09-28 06:10:32	2026-09-29 07:08:14
01a0f144-8fa2-7064-9874-f589eadf6737	81b8af3c-8ad4-40c9-9a64-d7ba0a5b5a90	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fa3-7161-82e4-dabfc2d8b235	81b8af3c-8ad4-40c9-9a64-d7ba0a5b5a90	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fa4-735a-9e89-382a67686baa	81b8af3c-8ad4-40c9-9a64-d7ba0a5b5a90	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fa5-7326-93c6-9639308e1a9d	81b8af3c-8ad4-40c9-9a64-d7ba0a5b5a90	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fa6-7315-a2c0-7613e7231ce3	81b8af3c-8ad4-40c9-9a64-d7ba0a5b5a90	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fa7-7251-8d80-60e99db2a8f7	81b8af3c-8ad4-40c9-9a64-d7ba0a5b5a90	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fa9-72ce-a61b-1b9cc67735c6	daeaa86f-366e-4675-b53e-658833f4ec09	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8faa-7189-9b5f-c371783c505f	daeaa86f-366e-4675-b53e-658833f4ec09	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fab-7234-87d4-4964f7269be7	daeaa86f-366e-4675-b53e-658833f4ec09	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fac-7303-a591-3c796bae9993	daeaa86f-366e-4675-b53e-658833f4ec09	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fad-7157-b217-0641adad8f93	daeaa86f-366e-4675-b53e-658833f4ec09	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fae-7196-81f3-105d23e00d66	daeaa86f-366e-4675-b53e-658833f4ec09	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a2-ed35-7216-9f89-c2a11398d790	8ee09056-ecda-49da-9447-5d2e1253466e	Arrival	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed36-720a-a6a2-4a797f8660c8	8ee09056-ecda-49da-9447-5d2e1253466e	Machining	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed37-72be-88d6-450cb2355eea	8ee09056-ecda-49da-9447-5d2e1253466e	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed38-72ee-9ed6-bbdc9c9a498a	8ee09056-ecda-49da-9447-5d2e1253466e	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed39-7237-94a5-43f84bdb1d04	8ee09056-ecda-49da-9447-5d2e1253466e	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed3a-72a3-911e-97a34ef8f521	8ee09056-ecda-49da-9447-5d2e1253466e	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed3c-70be-93dc-922fba151c5f	08ed9956-35a3-4998-bfc8-05adada9e241	Material	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed3d-71e4-a54f-3d67a87d7d32	08ed9956-35a3-4998-bfc8-05adada9e241	Arrival	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed3e-72b0-9e9a-2cfacf87f06b	08ed9956-35a3-4998-bfc8-05adada9e241	Machining	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed3f-738d-8162-430d7663621e	08ed9956-35a3-4998-bfc8-05adada9e241	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed3f-738d-8162-430d76749c2b	08ed9956-35a3-4998-bfc8-05adada9e241	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed40-709c-8c9a-d8dc1bd5a354	08ed9956-35a3-4998-bfc8-05adada9e241	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed41-72c7-b7bc-39140d98895f	08ed9956-35a3-4998-bfc8-05adada9e241	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed43-70ba-9c04-bfac74c24673	1374b366-898a-40f9-9e32-eee3057d7f58	Material	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed44-7218-856f-418598ea7af7	1374b366-898a-40f9-9e32-eee3057d7f58	Arrival	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed45-7286-9f80-52059cb7a1a9	1374b366-898a-40f9-9e32-eee3057d7f58	Machining	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed46-721d-afc2-160e744503e5	1374b366-898a-40f9-9e32-eee3057d7f58	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed47-739f-89db-d78a718fd33f	1374b366-898a-40f9-9e32-eee3057d7f58	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed48-705f-8d53-58ebe262a918	1374b366-898a-40f9-9e32-eee3057d7f58	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed49-726a-ad4b-e89531d48f25	1374b366-898a-40f9-9e32-eee3057d7f58	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed4a-713d-8d86-589257305453	91f6745b-fec3-4069-947e-4987ae14daa5	Material	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed4b-736f-b7e7-75cda2e430fd	91f6745b-fec3-4069-947e-4987ae14daa5	Arrival	Not Started		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed4c-72dc-9bc4-c8266fc147f5	91f6745b-fec3-4069-947e-4987ae14daa5	Machining	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed4d-7210-a110-87b6ed99fd79	91f6745b-fec3-4069-947e-4987ae14daa5	Hardening	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed4e-7196-9d41-6590a1385b48	91f6745b-fec3-4069-947e-4987ae14daa5	Grinding	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed4f-70fe-a0c0-497f23f5d865	91f6745b-fec3-4069-947e-4987ae14daa5	Wirecut	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a2-ed50-70e1-bbd8-1e0cfd8bebdb	91f6745b-fec3-4069-947e-4987ae14daa5	Assembly	-		\N	\N	2026-09-28 06:10:32	2026-09-28 06:10:32
01a0e6a5-d828-7071-89db-2ac1b0f8128d	bb2b6290-14c4-440b-b595-bffca5fb921f	Arrival	Done		2026-09-29 01:54:26	2026-09-25	2026-09-28 06:13:43	2026-09-30 04:49:23
01a0e6a4-f1f9-71d4-b4fa-31477d504936	73113411-a91b-46fa-8f06-2a3487b1cf68	PO	Not Started		\N	\N	2026-09-28 06:12:44	2026-09-28 06:12:44
01a0e6a4-f1fa-729e-bde7-b21e0d451188	73113411-a91b-46fa-8f06-2a3487b1cf68	Arrival	Not Started		\N	\N	2026-09-28 06:12:44	2026-09-28 06:12:44
01a0e6a4-f1fc-72f0-8c4a-c55a62882adb	5adfc0f5-0034-4a88-a787-fdee577e4839	PO	Not Started		\N	\N	2026-09-28 06:12:44	2026-09-28 06:12:44
01a0e6a4-f1fd-73fe-8b16-1ed7303b16d3	5adfc0f5-0034-4a88-a787-fdee577e4839	Arrival	Not Started		\N	\N	2026-09-28 06:12:44	2026-09-28 06:12:44
01a0e6a5-d82a-73b2-a1f5-9a9d3ca51a2a	bb2b6290-14c4-440b-b595-bffca5fb921f	Machining	Done		\N	\N	2026-09-28 06:13:43	2026-09-30 04:49:26
01a0e6a4-f203-72c7-b66a-ce3c6cef7f80	6d10370a-2ba6-4017-86a1-15e9bcaf1f3c	PO	Not Started		\N	\N	2026-09-28 06:12:44	2026-09-28 06:12:44
01a0e6a4-f203-72c7-b66a-ce3c6d7771fb	6d10370a-2ba6-4017-86a1-15e9bcaf1f3c	Arrival	Not Started		\N	\N	2026-09-28 06:12:44	2026-09-28 06:12:44
01a0e6a4-f210-724a-b2fa-5446adeb7983	d44598bf-8f95-41aa-bd24-ce5a8f132a82	Arrival	In Progress		2026-09-30 07:33:18	\N	2026-09-28 06:12:44	2026-09-30 07:33:18
01a0e6a4-f20f-712a-8e28-753a57a12206	d44598bf-8f95-41aa-bd24-ce5a8f132a82	PO	Done		2026-09-30 07:33:18	\N	2026-09-28 06:12:44	2026-09-30 07:33:27
01a0e6a4-f20b-7115-a2df-a47b99b480ab	5edb64e7-e25b-410f-baf3-df77f51c8fe2	PO	Not Started		\N	\N	2026-09-28 06:12:44	2026-09-28 06:12:44
01a0e6a4-f20c-73c5-a664-3abc0d7e796b	5edb64e7-e25b-410f-baf3-df77f51c8fe2	Arrival	Not Started		\N	\N	2026-09-28 06:12:44	2026-09-28 06:12:44
01a0f144-8faf-715c-b503-2356bea99b07	daeaa86f-366e-4675-b53e-658833f4ec09	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fb2-7048-87a4-608b79f7c50c	13d42e6c-3106-455d-86c9-1d985284edbd	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fb3-70e2-bd85-c6bb599c18f0	13d42e6c-3106-455d-86c9-1d985284edbd	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fb3-70e2-bd85-c6bb59adb2b8	13d42e6c-3106-455d-86c9-1d985284edbd	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fb4-7377-81a2-83d00958d09e	13d42e6c-3106-455d-86c9-1d985284edbd	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fb5-70ec-b849-ad5b04d466ed	13d42e6c-3106-455d-86c9-1d985284edbd	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a5-d827-7061-bec6-f08ffc675252	bb2b6290-14c4-440b-b595-bffca5fb921f	Material	Done		2026-09-28 08:01:36	\N	2026-09-28 06:13:43	2026-09-29 01:54:26
01a0e6a5-d821-7027-a371-6badd2832921	1120a6ca-5d7d-4551-865b-fa659f3bc071	Grinding	Done		2026-09-28 07:52:46	\N	2026-09-28 06:13:43	2026-09-29 05:54:39
01a0e6a5-d820-70a0-a2c0-b57b315bb69d	1120a6ca-5d7d-4551-865b-fa659f3bc071	Hardening	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a2-ec6e-7142-8bdd-5b0e0d1523d7	f698a227-ba55-403f-ae7b-df910acb54e4	Machining	In Progress		2026-09-29 07:08:14	\N	2026-09-28 06:10:32	2026-09-29 07:08:14
01a0e6a5-d822-7379-b3d4-2add15a8b80a	1120a6ca-5d7d-4551-865b-fa659f3bc071	Wirecut	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d823-70d0-8ffe-f8631f84f979	1120a6ca-5d7d-4551-865b-fa659f3bc071	Assembly	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a4-f1ff-73b8-92cb-23a000958861	f5a63a39-d09c-4fed-bf66-dcfe715cae36	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f206-703d-b089-a6a3142c5752	f16443d0-1bb5-408b-a457-0443b37d4464	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a5-d81d-737c-8a19-1008cae52f09	1120a6ca-5d7d-4551-865b-fa659f3bc071	Arrival	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 07:51:50
01a0e6a5-d82b-7078-be26-0cb8a14ed601	bb2b6290-14c4-440b-b595-bffca5fb921f	Hardening	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d819-73d8-a863-4f301ce63a44	1120a6ca-5d7d-4551-865b-fa659f3bc071	Material	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 07:51:52
01a0e6a5-d82c-72dd-8d43-624f47594f69	bb2b6290-14c4-440b-b595-bffca5fb921f	Wirecut	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d81e-730d-91dc-61aa1d9ded12	1120a6ca-5d7d-4551-865b-fa659f3bc071	Machining	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 07:52:10
01a0e6a4-f209-73cc-8ac0-60ae5beaaf7f	5cd8a082-36df-4983-ba8b-d7e62baecadf	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f212-72db-b9d8-f76fcadc6fe1	02732532-8b97-460b-8baa-077ce0a34bd9	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f215-7136-a7b1-da372d861da6	a3ede37e-9b7d-433a-bf1a-fb6e3861f87f	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f218-7074-9653-1e99a2252a8d	9edc5a02-cc74-46ff-bca5-8a188642b0cc	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0f144-8fb6-7303-a492-ab66dc56a519	13d42e6c-3106-455d-86c9-1d985284edbd	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a5-d82b-7078-be26-0cb8a20d828b	bb2b6290-14c4-440b-b595-bffca5fb921f	Grinding	Not Started		\N	\N	2026-09-28 06:13:43	2026-09-30 08:38:11
01a0e6a4-f219-70d8-8b7d-5e061e7b68e2	9edc5a02-cc74-46ff-bca5-8a188642b0cc	Arrival	In Progress		2026-09-30 03:48:22	2026-10-08	2026-09-28 06:12:44	2026-09-30 03:48:22
01a0e6a4-f216-7021-bf56-e09c9c1c01bb	a3ede37e-9b7d-433a-bf1a-fb6e3861f87f	Arrival	Done		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:48:35
01a0e6a4-f213-7130-91f4-8e648bd7000a	02732532-8b97-460b-8baa-077ce0a34bd9	Arrival	Done		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:48:37
01a0e6a4-f20a-7081-aea5-3bc24e62198c	5cd8a082-36df-4983-ba8b-d7e62baecadf	Arrival	Done		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:48:41
01a0e6a4-f207-701d-9575-8c58cbdcec11	f16443d0-1bb5-408b-a457-0443b37d4464	Arrival	Done		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:48:44
01a0e6a4-f200-7040-9868-bdf1c3cb25a4	f5a63a39-d09c-4fed-bf66-dcfe715cae36	Arrival	Done		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:48:48
01a0e6a4-f1f7-71de-971d-099ad45e7abc	739d5748-5a7c-4d35-a59d-f20adc2a7e6c	Arrival	Done		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:48:52
01a0f144-8fb7-722e-95a4-30bb86de8898	13d42e6c-3106-455d-86c9-1d985284edbd	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fb9-730d-8c1b-e58de9542d92	fdd0e25a-91f2-4820-86dc-4f1cbbc4c9fe	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fba-709c-bc79-2bc992dd632b	fdd0e25a-91f2-4820-86dc-4f1cbbc4c9fe	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fbb-72bd-bece-64750da0241f	fdd0e25a-91f2-4820-86dc-4f1cbbc4c9fe	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a4-f1a2-73a9-bd0c-f9f587932376	a77793cd-eb3f-4b61-ba7d-eaeb720a0150	Arrival	Done		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:25:11
01a0e6a4-f1a7-714a-be77-f136805945e4	338faa09-8e06-4a5d-931f-b6199dc33f30	Arrival	Done		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:25:11
01a0e6a4-f1ac-7219-9bd0-e4f2d2a3bf87	61e1f0dc-364e-4060-a386-947781b8787f	Arrival	Done		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:25:11
01a0e6a4-f1b0-7131-877c-67ac74d3df6a	ce5df457-fd44-49c6-9e1a-ce66f0c998b9	Arrival	Done		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:25:11
01a0e6a4-f19d-70f6-bad3-6a02f7f68226	a77793cd-eb3f-4b61-ba7d-eaeb720a0150	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:25:11
01a0e6a4-f1a5-731e-9c06-a656eddcf0b1	338faa09-8e06-4a5d-931f-b6199dc33f30	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:25:11
01a0e6a4-f1aa-71f8-8839-aac4f84c0f85	61e1f0dc-364e-4060-a386-947781b8787f	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:25:11
01a0e6a4-f1af-7023-a4ab-428afa7d57f9	ce5df457-fd44-49c6-9e1a-ce66f0c998b9	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:25:11
01a0f144-8fbc-71df-9676-caa892b878c8	fdd0e25a-91f2-4820-86dc-4f1cbbc4c9fe	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fbd-707f-b323-92e2e7256493	fdd0e25a-91f2-4820-86dc-4f1cbbc4c9fe	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a4-f1b4-72a9-93a4-9487901ef9a1	bfe004de-608e-4890-8fef-efb034d44325	Arrival	Done		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:26:31
01a0e6a4-f1b9-72a4-a32a-e6bbd23f9375	fe06eac2-0fe5-46e7-ab67-97a3dea60f85	Arrival	Done		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:26:31
01a0e6a4-f1b3-7004-bbe0-c5f335381676	bfe004de-608e-4890-8fef-efb034d44325	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:26:31
01a0e6a4-f1b8-702e-860e-4164af938390	fe06eac2-0fe5-46e7-ab67-97a3dea60f85	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:26:31
01a0e6a4-f1bc-71cf-ae1e-57e55a1fd1bf	b3b35750-af26-4563-a308-51ac1c6344b0	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f1c0-72c6-bc56-d1a97c426b4d	98bf3893-f893-49e9-8fdc-807d733e5161	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f1c4-732c-ad30-4006c0118cb9	cf71fa72-2495-493f-b838-9dade17b12dd	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f1c7-71c6-bf85-73c3450516b8	646bdcc3-ba1b-4e43-b099-7858b44f0e11	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f1cc-70bb-8a44-b88769b2a3ae	f0b48a56-bf66-4583-a585-fc5318266d8c	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f1d0-7224-af36-74667fba112c	a92f8656-82b9-4264-b4cf-d1efb98568d1	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f1d3-715e-b332-95f6b0499c0f	afe15676-56ea-4150-986c-ab7f9b399df2	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f1d6-704d-bacb-f912586e0cc7	b8857226-a129-4f1c-a994-22eebb2e7aa6	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f1db-730b-9bc5-143befeaddab	7b0361ed-8d29-4c5e-9b3d-47f0ea4b7e20	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f1de-7120-93ca-37b820308b0e	b4b2e916-5dc6-4ebb-bad8-ed52b397b525	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f1e2-7005-9601-6a7623c3e23a	23c648f7-2f0c-49eb-b66f-6302b23d49cb	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f1e5-70c1-b698-c55209332ba3	2ac2c9f4-8330-40a4-adbf-fda115c57c87	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f1e8-7086-a5d3-d62cd867ea17	1c87a74b-6a25-4c4d-b873-03365bec15eb	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f1ef-70b4-9998-dca6d482f982	64a0a077-6719-40eb-8ef1-b2c55681a093	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0e6a4-f1f6-72a9-8f93-ade4be5941ae	739d5748-5a7c-4d35-a59d-f20adc2a7e6c	PO	Done		\N	\N	2026-09-28 06:12:44	2026-09-30 03:41:21
01a0f144-8fbe-71ae-94ee-5322eb668e7e	fdd0e25a-91f2-4820-86dc-4f1cbbc4c9fe	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fbf-725e-b32c-3d942c206150	fdd0e25a-91f2-4820-86dc-4f1cbbc4c9fe	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fc2-7113-8fcb-f3f27e7af323	0a8e7a90-f291-452e-8e94-d14a65db32b5	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fc3-7145-904f-e934adc8e5ba	0a8e7a90-f291-452e-8e94-d14a65db32b5	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fc4-7238-9322-f29b1551bbf1	0a8e7a90-f291-452e-8e94-d14a65db32b5	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fc5-7050-9c9f-2b046eaff82f	0a8e7a90-f291-452e-8e94-d14a65db32b5	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fc6-7014-a70b-321f9ecc8c36	0a8e7a90-f291-452e-8e94-d14a65db32b5	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fc7-737e-93d6-e089b2e2f321	0a8e7a90-f291-452e-8e94-d14a65db32b5	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fc7-737e-93d6-e089b3631e40	0a8e7a90-f291-452e-8e94-d14a65db32b5	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fc9-7340-a95c-d61ab514e748	36bb148e-72d1-4a79-ae1d-7677e1fe9c30	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fca-7291-bfa1-8cb96389b661	36bb148e-72d1-4a79-ae1d-7677e1fe9c30	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fcb-719c-8e1c-9f74b6640770	36bb148e-72d1-4a79-ae1d-7677e1fe9c30	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fcc-723c-bbe3-ed25ea021726	36bb148e-72d1-4a79-ae1d-7677e1fe9c30	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fcd-71b9-b05c-910402df4983	36bb148e-72d1-4a79-ae1d-7677e1fe9c30	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fce-725b-b3df-6ec51e8da8bf	36bb148e-72d1-4a79-ae1d-7677e1fe9c30	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fcf-73e6-9c35-5c457f3a46d7	36bb148e-72d1-4a79-ae1d-7677e1fe9c30	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fd1-7265-a4af-49f73fc12e10	c1077155-07b8-452e-b02c-a702b44bef52	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fd2-7142-8d82-58d02d510489	c1077155-07b8-452e-b02c-a702b44bef52	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fd3-7236-a92a-8f8f72807821	c1077155-07b8-452e-b02c-a702b44bef52	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fd4-7095-9a2e-50f426e490a6	c1077155-07b8-452e-b02c-a702b44bef52	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fd5-71a2-af64-430efcf7fc03	c1077155-07b8-452e-b02c-a702b44bef52	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fd6-704c-9b31-2146a5c57176	c1077155-07b8-452e-b02c-a702b44bef52	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fd6-704c-9b31-2146a5db0c41	c1077155-07b8-452e-b02c-a702b44bef52	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fd8-7048-ac8f-2c89289708b8	cc1c421d-d01a-4c66-97e3-e55f41312f47	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fd9-70c8-bea5-c18f771d2f0f	cc1c421d-d01a-4c66-97e3-e55f41312f47	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fda-7240-8725-a35daddc89af	cc1c421d-d01a-4c66-97e3-e55f41312f47	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a4-f1c1-709f-b96c-d064f55ddd25	98bf3893-f893-49e9-8fdc-807d733e5161	Arrival	Done		2026-09-30 03:44:53	2026-10-01	2026-09-28 06:12:44	2026-10-01 03:48:47
01a0e6a4-f1ec-739c-b072-f9117eed7c90	e2d75cb9-faba-4d9a-b87f-06ece853b82d	PO	Not Started		\N	\N	2026-09-28 06:12:44	2026-09-28 06:12:44
01a0e6a4-f1f2-73fc-a6bf-4f553d3e939c	f3e08642-919c-4f60-bc34-0d76ac4723b8	PO	Not Started		\N	\N	2026-09-28 06:12:44	2026-09-28 06:12:44
01a0e6a4-f1f3-7142-9a45-e14f511e02df	f3e08642-919c-4f60-bc34-0d76ac4723b8	Arrival	Not Started		\N	\N	2026-09-28 06:12:44	2026-09-28 06:12:44
01a0e6a4-f1c5-72c3-9146-41b3579762eb	cf71fa72-2495-493f-b838-9dade17b12dd	Arrival	Not Started		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:41:22
01a0e6a4-f1c9-737e-af51-cf3eabfcc52d	646bdcc3-ba1b-4e43-b099-7858b44f0e11	Arrival	Not Started		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:41:22
01a0e6a4-f1cd-7004-8555-aefd4ba425d9	f0b48a56-bf66-4583-a585-fc5318266d8c	Arrival	Not Started		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:41:22
01a0e6a4-f1d1-72c9-b9d3-5a6aa4b1e165	a92f8656-82b9-4264-b4cf-d1efb98568d1	Arrival	Not Started		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:41:22
01a0e6a4-f1d4-70ca-87db-8af5642fff3e	afe15676-56ea-4150-986c-ab7f9b399df2	Arrival	Not Started		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:41:22
01a0e6a4-f1d8-72df-8462-c60a53cbdd59	b8857226-a129-4f1c-a994-22eebb2e7aa6	Arrival	Not Started		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:41:22
01a0e6a4-f1dc-73b4-aa4e-4a2b7de8ba17	7b0361ed-8d29-4c5e-9b3d-47f0ea4b7e20	Arrival	Not Started		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:41:22
01a0e6a4-f1df-72a5-930b-c04a87500375	b4b2e916-5dc6-4ebb-bad8-ed52b397b525	Arrival	Not Started		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:41:22
01a0e6a4-f1e2-7005-9601-6a7623c9ed4b	23c648f7-2f0c-49eb-b66f-6302b23d49cb	Arrival	Not Started		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:41:22
01a0e6a4-f1e6-7338-86db-a15cb4ddc4f8	2ac2c9f4-8330-40a4-adbf-fda115c57c87	Arrival	Not Started		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:41:22
01a0e6a4-f1e9-73ad-96d6-bc9dfcc64097	1c87a74b-6a25-4c4d-b873-03365bec15eb	Arrival	Not Started		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:41:22
01a0e6a4-f1f0-71d9-b531-f0f9fc3881f6	64a0a077-6719-40eb-8ef1-b2c55681a093	Arrival	Done		\N	2026-09-29	2026-09-28 06:12:44	2026-09-30 03:48:59
01a0e6a4-f1ed-7245-a416-7600d2351dfa	e2d75cb9-faba-4d9a-b87f-06ece853b82d	Arrival	-		2026-09-30 03:49:29	\N	2026-09-28 06:12:44	2026-09-30 03:49:32
01a0e6a5-d82d-7092-b4bc-848b781679f6	bb2b6290-14c4-440b-b595-bffca5fb921f	Assembly	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d83a-7254-8166-ea6dcaca7a0a	41d35a4d-475e-425d-9091-8f4720b9c1b7	Hardening	Done		2026-09-28 08:53:58	\N	2026-09-28 06:13:43	2026-09-30 02:54:20
01a0e6a5-d83b-733d-8ff4-413014dec712	41d35a4d-475e-425d-9091-8f4720b9c1b7	Grinding	Done		\N	\N	2026-09-28 06:13:43	2026-09-30 02:54:26
01a0e6a5-d83b-733d-8ff4-413015d046c0	41d35a4d-475e-425d-9091-8f4720b9c1b7	Wirecut	In Progress SC		2026-09-30 02:56:12	\N	2026-09-28 06:13:43	2026-09-30 02:56:12
01a0e6a5-d832-739c-845c-843b6e6bf68a	4f093c41-2538-48da-aec7-60532b637196	Hardening	Done		2026-09-28 08:53:55	\N	2026-09-28 06:13:43	2026-09-30 02:56:18
01a0f144-8fdb-71b0-9fbb-b196f8a96bed	cc1c421d-d01a-4c66-97e3-e55f41312f47	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a5-d834-721c-ad39-1f96ab310653	4f093c41-2538-48da-aec7-60532b637196	Wirecut	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d834-721c-ad39-1f96ac0d29b2	4f093c41-2538-48da-aec7-60532b637196	Assembly	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d833-70a6-85f8-ef669d16dd96	4f093c41-2538-48da-aec7-60532b637196	Grinding	Not Started		\N	\N	2026-09-28 06:13:43	2026-09-30 02:56:24
01a0e6a5-d840-73d7-abfd-e1b1087985f9	cfa9cb0f-804a-47a2-9d4f-4099d5b79497	Machining	Done		\N	\N	2026-09-28 06:13:43	2026-09-30 02:56:45
01a0e6a5-d840-73d7-abfd-e1b109033d1e	cfa9cb0f-804a-47a2-9d4f-4099d5b79497	Hardening	In Progress SC		2026-09-30 02:57:31	\N	2026-09-28 06:13:43	2026-09-30 02:57:31
01a0e6a6-7b1a-7109-8112-1e199f492e52	17d90512-1a81-45b8-ac46-1a1bdf47db45	PO	Done		\N	\N	2026-09-28 06:14:25	2026-09-30 03:51:36
01a0f144-8fdd-7018-88fd-361004d7d745	cc1c421d-d01a-4c66-97e3-e55f41312f47	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a5-d83c-7220-949d-d6926705f648	41d35a4d-475e-425d-9091-8f4720b9c1b7	Assembly	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d82f-739f-9ee9-f7cb20db0d20	4f093c41-2538-48da-aec7-60532b637196	Material	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 08:53:36
01a0e6a5-d830-73e7-ad2f-b578aabba315	4f093c41-2538-48da-aec7-60532b637196	Arrival	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 08:53:38
01a0e6a5-d841-731d-a545-331a8cc5ce76	cfa9cb0f-804a-47a2-9d4f-4099d5b79497	Grinding	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d843-718b-b5f4-4fe5f8630328	cfa9cb0f-804a-47a2-9d4f-4099d5b79497	Wirecut	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d844-709c-af2e-84018620d48e	cfa9cb0f-804a-47a2-9d4f-4099d5b79497	Assembly	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d836-72f7-a1d9-550d326b0cfa	41d35a4d-475e-425d-9091-8f4720b9c1b7	Material	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 08:53:40
01a0e6a5-d838-71a1-94fb-e52256929f59	41d35a4d-475e-425d-9091-8f4720b9c1b7	Arrival	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 08:53:42
01a0e6a5-d831-7102-b5d5-57493b86e4d4	4f093c41-2538-48da-aec7-60532b637196	Machining	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 08:53:47
01a0e6a5-d848-71d5-a85a-e4bb12b2f6d1	daf585e6-8461-4cb9-b830-b415f8ce0a0b	Hardening	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d839-71a5-b1ee-ea57cac7a7c2	41d35a4d-475e-425d-9091-8f4720b9c1b7	Machining	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 08:53:49
01a0e6a5-d84a-7362-8cb6-d2d71ca4c7d8	daf585e6-8461-4cb9-b830-b415f8ce0a0b	Wirecut	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d84b-7264-a0ed-38d4eda598d8	daf585e6-8461-4cb9-b830-b415f8ce0a0b	Assembly	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d83e-7325-af1a-fef781f6a2bf	cfa9cb0f-804a-47a2-9d4f-4099d5b79497	Material	Done		2026-09-28 08:01:36	\N	2026-09-28 06:13:43	2026-09-29 01:54:26
01a0e6a5-d84f-710c-b074-ecc4bbbacf35	b466fd85-11e4-4188-a162-b9abda95fbbf	Hardening	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d851-73af-82d0-5118ac24e19c	b466fd85-11e4-4188-a162-b9abda95fbbf	Wirecut	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d851-73af-82d0-5118ace2c073	b466fd85-11e4-4188-a162-b9abda95fbbf	Assembly	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d849-7224-a431-838cb98f49c7	daf585e6-8461-4cb9-b830-b415f8ce0a0b	Grinding	Done		\N	\N	2026-09-28 06:13:43	2026-09-29 05:54:49
01a0e6a5-d850-721f-a060-e07231cc87fa	b466fd85-11e4-4188-a162-b9abda95fbbf	Grinding	Done		\N	\N	2026-09-28 06:13:43	2026-09-29 05:55:09
01a0e6a5-d856-70e6-ab10-04ecbee8f88e	d8983675-f1b3-4e21-9316-f9103659eb00	Grinding	Done		\N	\N	2026-09-28 06:13:43	2026-09-29 05:55:15
01a0e6a5-d855-7238-9ac9-b032b9b74d6e	d8983675-f1b3-4e21-9316-f9103659eb00	Hardening	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d857-725f-938f-c9b2bb149d4e	d8983675-f1b3-4e21-9316-f9103659eb00	Wirecut	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d858-73e0-82f4-5bfa7693e486	d8983675-f1b3-4e21-9316-f9103659eb00	Assembly	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d859-712f-8aa8-476702c8f68a	d41cbe4e-b4af-4362-be98-db0cc943fa90	Material	Not Started		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d85a-73da-9065-d830332186ca	d41cbe4e-b4af-4362-be98-db0cc943fa90	Arrival	Not Started		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d85b-720f-b1a0-4b6063882589	d41cbe4e-b4af-4362-be98-db0cc943fa90	Machining	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d85c-7383-8a13-148e8c9df586	d41cbe4e-b4af-4362-be98-db0cc943fa90	Hardening	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d85c-7383-8a13-148e8cf64c89	d41cbe4e-b4af-4362-be98-db0cc943fa90	Grinding	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d85d-72fb-a92e-82471c71c06a	d41cbe4e-b4af-4362-be98-db0cc943fa90	Wirecut	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d85e-70e0-afe3-6d6eb414e40c	d41cbe4e-b4af-4362-be98-db0cc943fa90	Assembly	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d860-70a6-9295-f27d835659f3	7f4cbc24-82ef-4d6e-84c3-7a6fdcf40ac1	Material	Not Started		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d861-7031-abb2-c0bb209eff79	7f4cbc24-82ef-4d6e-84c3-7a6fdcf40ac1	Arrival	Not Started		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d861-7031-abb2-c0bb20acdbe2	7f4cbc24-82ef-4d6e-84c3-7a6fdcf40ac1	Machining	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d862-73fa-b993-b745143b7f1a	7f4cbc24-82ef-4d6e-84c3-7a6fdcf40ac1	Hardening	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d863-710e-b35f-624f220fd5ba	7f4cbc24-82ef-4d6e-84c3-7a6fdcf40ac1	Grinding	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d863-710e-b35f-624f225f7871	7f4cbc24-82ef-4d6e-84c3-7a6fdcf40ac1	Wirecut	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d864-730d-ae4b-8a2c0ac7be2d	7f4cbc24-82ef-4d6e-84c3-7a6fdcf40ac1	Assembly	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d866-734a-84ea-fd2145eb0998	4bc35b1c-e5d6-4abc-958c-4382a4e5ed5a	Material	Not Started		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d866-734a-84ea-fd214631db8b	4bc35b1c-e5d6-4abc-958c-4382a4e5ed5a	Arrival	Not Started		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d867-717c-86fb-98cb3045a26c	4bc35b1c-e5d6-4abc-958c-4382a4e5ed5a	Machining	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d868-7305-af07-60c7bbda2b7d	4bc35b1c-e5d6-4abc-958c-4382a4e5ed5a	Hardening	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d869-73a5-a741-80814cb27ef5	4bc35b1c-e5d6-4abc-958c-4382a4e5ed5a	Grinding	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d869-73a5-a741-80814cd23831	4bc35b1c-e5d6-4abc-958c-4382a4e5ed5a	Wirecut	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d86a-7005-8cda-689fa6d60028	4bc35b1c-e5d6-4abc-958c-4382a4e5ed5a	Assembly	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d86b-7186-b837-153cf5fd64a3	9206e5c3-f52c-4d17-887b-3ecd37f51d24	Material	Not Started		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d86c-7007-be16-ed49348607a5	9206e5c3-f52c-4d17-887b-3ecd37f51d24	Arrival	Not Started		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d86d-72ac-b908-06db7fad76f5	9206e5c3-f52c-4d17-887b-3ecd37f51d24	Machining	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d86d-72ac-b908-06db808d622b	9206e5c3-f52c-4d17-887b-3ecd37f51d24	Hardening	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d86e-702f-9d88-7f8762076b27	9206e5c3-f52c-4d17-887b-3ecd37f51d24	Grinding	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d86f-71af-90f8-2b8810f18f5c	9206e5c3-f52c-4d17-887b-3ecd37f51d24	Wirecut	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d86f-71af-90f8-2b88113348f1	9206e5c3-f52c-4d17-887b-3ecd37f51d24	Assembly	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d871-71ed-b472-729bac6857ac	a38bfdf9-d7c5-4da8-9414-50670e0f2ac7	Material	Not Started		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d871-71ed-b472-729bad334511	a38bfdf9-d7c5-4da8-9414-50670e0f2ac7	Arrival	Not Started		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d872-7000-abd9-03184ca7cb91	a38bfdf9-d7c5-4da8-9414-50670e0f2ac7	Machining	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d873-7130-a333-530f55088df3	a38bfdf9-d7c5-4da8-9414-50670e0f2ac7	Hardening	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d873-7130-a333-530f5525c662	a38bfdf9-d7c5-4da8-9414-50670e0f2ac7	Grinding	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d874-71e1-93f5-e01a2b021305	a38bfdf9-d7c5-4da8-9414-50670e0f2ac7	Wirecut	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d875-71a4-b3d3-b12e62368146	a38bfdf9-d7c5-4da8-9414-50670e0f2ac7	Assembly	-		\N	\N	2026-09-28 06:13:43	2026-09-28 06:13:43
01a0e6a5-d846-7131-9385-8a8057168ebb	daf585e6-8461-4cb9-b830-b415f8ce0a0b	Arrival	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 07:55:06
01a0e6a5-d84d-7277-b5ee-57b1b171b5ce	b466fd85-11e4-4188-a162-b9abda95fbbf	Material	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 07:55:12
01a0e6a5-d84d-7277-b5ee-57b1b25dc8f0	b466fd85-11e4-4188-a162-b9abda95fbbf	Arrival	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 07:55:14
01a0e6a5-d84e-7200-928e-aad930f6ab73	b466fd85-11e4-4188-a162-b9abda95fbbf	Machining	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 07:55:18
01a0e6a5-d847-7068-97c6-4be22bcc501b	daf585e6-8461-4cb9-b830-b415f8ce0a0b	Machining	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 07:55:56
01a0e6a5-d854-736a-80f0-adb0be5327b1	d8983675-f1b3-4e21-9316-f9103659eb00	Machining	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 07:56:02
01a0e6a5-d854-736a-80f0-adb0be088745	d8983675-f1b3-4e21-9316-f9103659eb00	Arrival	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 07:56:09
01a0e6a5-d853-73ac-b084-db588b5f0372	d8983675-f1b3-4e21-9316-f9103659eb00	Material	Done		\N	\N	2026-09-28 06:13:43	2026-09-28 07:56:12
01a0f144-8fde-72af-8637-d61ab9be8a7f	cc1c421d-d01a-4c66-97e3-e55f41312f47	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fde-72af-8637-d61ab9e958b2	cc1c421d-d01a-4c66-97e3-e55f41312f47	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fe0-728c-af15-d21e16a458fa	f08e0334-48a1-4ee6-8165-a98b85f356bc	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fe1-72fe-8977-7eda345da00d	f08e0334-48a1-4ee6-8165-a98b85f356bc	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fe3-7069-a9af-655e812684b7	f08e0334-48a1-4ee6-8165-a98b85f356bc	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fe4-7213-8db2-3a3be8c329e0	f08e0334-48a1-4ee6-8165-a98b85f356bc	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fe5-73aa-9dd3-971713e7ee93	f08e0334-48a1-4ee6-8165-a98b85f356bc	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fe6-7277-8d4f-65bde7f39e46	f08e0334-48a1-4ee6-8165-a98b85f356bc	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fe7-7353-9e38-3b73aab9c55f	f08e0334-48a1-4ee6-8165-a98b85f356bc	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fe8-70a0-90f5-774447db7c89	8564ca28-a341-4744-b26e-699197adca8f	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a6-7b30-724d-a35d-b75184dbd057	a5e2bad7-28d2-4acb-ac73-bde5965ad096	Arrival	Not Started		\N	\N	2026-09-28 06:14:25	2026-09-28 06:14:25
01a0f144-8fe9-7349-8c7c-67147baff6e9	8564ca28-a341-4744-b26e-699197adca8f	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fea-7259-9481-299a6760ac8b	8564ca28-a341-4744-b26e-699197adca8f	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8feb-7239-9c69-fb99bc37ca11	8564ca28-a341-4744-b26e-699197adca8f	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fec-72aa-b907-5bbb330188fd	8564ca28-a341-4744-b26e-699197adca8f	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fed-70cf-a88b-8deab2ca2c4e	8564ca28-a341-4744-b26e-699197adca8f	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8fee-71ac-b980-9cbca72a7f19	8564ca28-a341-4744-b26e-699197adca8f	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8ff0-73e0-9734-68d65555a232	d9865371-9705-4096-ba2a-33bef025cf0a	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8ff1-71c7-a51e-38ccb6e109d8	d9865371-9705-4096-ba2a-33bef025cf0a	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8ff1-71c7-a51e-38ccb7bcaad8	d9865371-9705-4096-ba2a-33bef025cf0a	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8ff3-715a-adaa-00ae36c51177	d9865371-9705-4096-ba2a-33bef025cf0a	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8ff4-70c5-a8b7-b72df7fac1d4	d9865371-9705-4096-ba2a-33bef025cf0a	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8ff5-714e-bdb1-8ce493369164	d9865371-9705-4096-ba2a-33bef025cf0a	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-8ff6-709d-8b9c-c060cfc30f23	d9865371-9705-4096-ba2a-33bef025cf0a	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a6-7b22-7119-8404-44628f10e2a1	115dac39-f0e2-4fe0-9a88-3a02ba8abde5	PO	Done		\N	\N	2026-09-28 06:14:25	2026-09-30 03:51:36
01a0f144-8ff8-7375-85e8-a3337f9133eb	6d02a17a-52dd-407c-a26a-4d058b9c8903	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a6-7b25-7324-9a00-9fe9dc452738	df0f7659-199f-4825-9668-066fdf8488aa	PO	Done		\N	\N	2026-09-28 06:14:25	2026-09-30 03:51:36
01a0f144-8ff9-7372-aaa5-8747942d9099	6d02a17a-52dd-407c-a26a-4d058b9c8903	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a6-7b29-7153-872c-d4ece847d3eb	b0a35819-4f2a-472c-8e4d-c6e8d6f01a6b	PO	Done		\N	\N	2026-09-28 06:14:25	2026-09-30 03:51:36
01a0f144-8ffa-706c-a5c3-a97a36c82327	6d02a17a-52dd-407c-a26a-4d058b9c8903	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a6-7b2c-7315-b804-a209d91c22fa	b383b554-431a-4029-a21f-7182a7f701c5	PO	Done		\N	\N	2026-09-28 06:14:25	2026-09-30 03:51:36
01a0f144-8ffb-70ff-bae6-7a7626cd1156	6d02a17a-52dd-407c-a26a-4d058b9c8903	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a6-7b3a-72c0-b428-019bb658ea5e	f74c6233-4387-44a0-b469-aa585fc05766	PO	Done		\N	\N	2026-09-28 06:14:25	2026-09-30 03:51:36
01a0f144-8ffb-70ff-bae6-7a7626ed54d8	6d02a17a-52dd-407c-a26a-4d058b9c8903	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a6-7b3c-71d4-8359-f2172da17125	51ba7d45-45a5-4688-8e4e-a9b7098a2dc2	PO	Done		\N	\N	2026-09-28 06:14:25	2026-09-30 03:51:36
01a0f144-8ffc-70ec-9019-76e616060fd1	6d02a17a-52dd-407c-a26a-4d058b9c8903	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a6-7b3e-70a7-9db4-c458eb874b02	941ec030-bfc2-4a65-a116-f230c0d9846b	PO	Done		\N	\N	2026-09-28 06:14:25	2026-09-30 03:51:36
01a0f144-8ffd-7288-b7b6-bbc178042ef6	6d02a17a-52dd-407c-a26a-4d058b9c8903	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a6-7b1f-7357-8155-12fdc5e7bb19	17d90512-1a81-45b8-ac46-1a1bdf47db45	Arrival	Done		\N	2026-09-29	2026-09-28 06:14:25	2026-09-30 03:51:36
01a0e6a6-7b23-707d-a071-4bc28cbeb581	115dac39-f0e2-4fe0-9a88-3a02ba8abde5	Arrival	Done		\N	2026-09-29	2026-09-28 06:14:25	2026-09-30 03:51:36
01a0e6a6-7b26-737d-9030-a34379117ce9	df0f7659-199f-4825-9668-066fdf8488aa	Arrival	Done		\N	2026-09-29	2026-09-28 06:14:25	2026-09-30 03:51:36
01a0e6a6-7b2a-70a8-a88c-542d6af57bb4	b0a35819-4f2a-472c-8e4d-c6e8d6f01a6b	Arrival	Done		\N	2026-09-29	2026-09-28 06:14:25	2026-09-30 03:51:36
01a0e6a6-7b2d-7033-a4d7-9430dddae685	b383b554-431a-4029-a21f-7182a7f701c5	Arrival	Done		\N	2026-09-29	2026-09-28 06:14:25	2026-09-30 03:51:36
01a0e6a6-7b3b-72ab-bf6f-56c6f6e156d6	f74c6233-4387-44a0-b469-aa585fc05766	Arrival	Done		\N	2026-09-29	2026-09-28 06:14:25	2026-09-30 03:51:36
01a0e6a6-7b3d-709a-9774-0a25704e7055	51ba7d45-45a5-4688-8e4e-a9b7098a2dc2	Arrival	Done		\N	2026-09-29	2026-09-28 06:14:25	2026-09-30 03:51:36
01a0e6a6-7b3f-7201-9ee5-b90605dc2e55	941ec030-bfc2-4a65-a116-f230c0d9846b	Arrival	Done		\N	2026-09-29	2026-09-28 06:14:25	2026-09-30 03:51:36
01a0f144-9000-731c-ad2c-a23e3da85f72	5d1d8e1a-d6b4-4ec1-ba86-0acc67fce08a	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9000-731c-ad2c-a23e3dca5df2	5d1d8e1a-d6b4-4ec1-ba86-0acc67fce08a	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0e6a6-7b32-723a-8fd1-be4526681f00	1a5f8599-a44e-42fc-ba92-0acfbee4f1fa	PO	Done		\N	\N	2026-09-28 06:14:25	2026-09-30 03:52:05
01a0e6a6-7b35-704d-ad95-52eb59f4c3d4	8cd5a875-143c-4c1f-a33c-53b927dcda08	PO	Done		\N	\N	2026-09-28 06:14:25	2026-09-30 03:52:08
01a0e6a6-7b37-72ab-9c4a-a9dcf75eb663	e9c36345-0b23-4faf-b96c-909c5dfccd74	PO	Done		\N	\N	2026-09-28 06:14:25	2026-09-30 03:52:10
01a0e6a6-7b33-71b2-9a26-567c0c5cfc53	1a5f8599-a44e-42fc-ba92-0acfbee4f1fa	Arrival	Done		\N	\N	2026-09-28 06:14:25	2026-09-30 03:52:12
01a0e6a6-7b36-7061-98fc-02bcd24eb910	8cd5a875-143c-4c1f-a33c-53b927dcda08	Arrival	Done		\N	\N	2026-09-28 06:14:25	2026-09-30 03:52:14
01a0e6a6-7b38-7353-a839-d405d4d92373	e9c36345-0b23-4faf-b96c-909c5dfccd74	Arrival	Done		\N	\N	2026-09-28 06:14:25	2026-09-30 03:52:16
01a0e6a6-7b2f-71b1-a6d9-30a2b1578763	a5e2bad7-28d2-4acb-ac73-bde5965ad096	PO	Not Started		\N	\N	2026-09-28 06:14:25	2026-09-30 03:52:29
01a0f144-9001-70cb-9382-65859fd4f92b	5d1d8e1a-d6b4-4ec1-ba86-0acc67fce08a	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9002-7193-ac55-75964e0e0590	5d1d8e1a-d6b4-4ec1-ba86-0acc67fce08a	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9004-7371-a706-023410864d34	5d1d8e1a-d6b4-4ec1-ba86-0acc67fce08a	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9005-729c-8eba-aacaa868534e	5d1d8e1a-d6b4-4ec1-ba86-0acc67fce08a	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9006-73a3-837d-1ab3244da5bb	5d1d8e1a-d6b4-4ec1-ba86-0acc67fce08a	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9008-7058-9b07-ab541eed5278	52bb3a42-f6b1-4f03-832f-ce664d03f9b2	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9009-70f3-87aa-afc8908dbf34	52bb3a42-f6b1-4f03-832f-ce664d03f9b2	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-900a-710d-ac28-05887afbbe87	52bb3a42-f6b1-4f03-832f-ce664d03f9b2	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-900b-70f8-ae2f-0fbf9516ea95	52bb3a42-f6b1-4f03-832f-ce664d03f9b2	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-900c-73e4-a323-416e7c169775	52bb3a42-f6b1-4f03-832f-ce664d03f9b2	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-900d-707c-b7cb-5acd5cd58f46	52bb3a42-f6b1-4f03-832f-ce664d03f9b2	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-900e-724c-8c2f-8151a4f6d03f	52bb3a42-f6b1-4f03-832f-ce664d03f9b2	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-902e-70f8-b092-415abab60912	205c6252-450a-48c2-97ab-a5eef7f58635	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-902f-70e3-9e9e-3fc9655bb936	205c6252-450a-48c2-97ab-a5eef7f58635	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9030-7373-95e8-a41140f90b2c	205c6252-450a-48c2-97ab-a5eef7f58635	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9031-7333-997c-7d2e535bd928	205c6252-450a-48c2-97ab-a5eef7f58635	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9032-7031-ae98-8c6d5196a71c	205c6252-450a-48c2-97ab-a5eef7f58635	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9034-7336-8cb2-f4913b6f1ab6	205c6252-450a-48c2-97ab-a5eef7f58635	Wirecut	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9035-707c-b7dc-ff431e137741	205c6252-450a-48c2-97ab-a5eef7f58635	Assembly	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-9039-72c5-b40a-71f5398ea51a	7665747c-6bb8-49d5-8602-d23f5638a6e1	Material	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-903a-7305-a406-d523034bc614	7665747c-6bb8-49d5-8602-d23f5638a6e1	Arrival	Not Started		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-903b-725a-99b9-ab2408e3c2c8	7665747c-6bb8-49d5-8602-d23f5638a6e1	Machining	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-903c-70a0-b1a9-c8c6538ff504	7665747c-6bb8-49d5-8602-d23f5638a6e1	Hardening	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
01a0f144-903e-724c-8f49-5bd730991ad0	7665747c-6bb8-49d5-8602-d23f5638a6e1	Grinding	-		\N	\N	2026-09-30 07:43:17	2026-09-30 07:43:17
\.


--
-- Data for Name: failed_jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.failed_jobs (id, uuid, connection, queue, payload, exception, failed_at) FROM stdin;
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.items (id, category_id, no, description, dimension, material, qty, hrc, is_subcont, subcont_notes, subcont_supplier, subcont_status, subcont_process, subcont_dispatch_date, subcont_done_at, arrival_target_date, sort_order, created_at, updated_at) FROM stdin;
a77793cd-eb3f-4b61-ba7d-eaeb720a0150	01a0e69e-1881-73b3-9dfc-701ffddf5816	S1	GUIDE POST SET	MYAP 32-170	STD	4		f	\N	\N	\N	\N	\N	\N	2026-09-29	1	2026-09-28 06:12:44	2026-09-30 03:25:10
338faa09-8e06-4a5d-931f-b6199dc33f30	01a0e69e-1881-73b3-9dfc-701ffddf5816	S2A	STRIPPER GUIDE PIN	SGPH 20-110	STD	4		f	\N	\N	\N	\N	\N	\N	2026-09-29	2	2026-09-28 06:12:44	2026-09-30 03:25:10
61e1f0dc-364e-4060-a386-947781b8787f	01a0e69e-1881-73b3-9dfc-701ffddf5816	S2B	GUIDE BUSHING 1	SGBH 20-30	STD	8		f	\N	\N	\N	\N	\N	\N	2026-09-29	3	2026-09-28 06:12:44	2026-09-30 03:25:10
ce5df457-fd44-49c6-9e1a-ce66f0c998b9	01a0e69e-1881-73b3-9dfc-701ffddf5816	S2C	GUIDE BUSHING 2	SGBH 20-35	STD	4		f	\N	\N	\N	\N	\N	\N	2026-09-29	4	2026-09-28 06:12:44	2026-09-30 03:25:10
bfe004de-608e-4890-8fef-efb034d44325	01a0e69e-1881-73b3-9dfc-701ffddf5816	S3	SPRING	SWB 30-75	STD	13		f	\N	\N	\N	\N	\N	\N	2026-09-29	5	2026-09-28 06:12:44	2026-09-30 03:26:31
fe06eac2-0fe5-46e7-ab67-97a3dea60f85	01a0e69e-1881-73b3-9dfc-701ffddf5816	S4	STRIPPER BOLT	CSR 16-50	STD	10		f	\N	\N	\N	\N	\N	\N	2026-09-29	6	2026-09-28 06:12:44	2026-09-30 03:26:31
64a0a077-6719-40eb-8ef1-b2c55681a093	01a0e69e-1881-73b3-9dfc-701ffddf5816	S14	PIN	MSTH 10-50	STD	2		f	\N	\N	\N	\N	\N	\N	2026-09-29	21	2026-09-28 06:12:44	2026-09-30 03:41:22
739d5748-5a7c-4d35-a59d-f20adc2a7e6c	01a0e69e-1881-73b3-9dfc-701ffddf5816	S16	PIN	MSTH 8-40	STD	10		f	\N	\N	\N	\N	\N	\N	2026-09-29	23	2026-09-28 06:12:44	2026-09-30 03:41:22
f5a63a39-d09c-4fed-bf66-dcfe715cae36	01a0e69e-1881-73b3-9dfc-701ffddf5816	S19	BOLT L	M10-75	STD	22		f	\N	\N	\N	\N	\N	\N	2026-09-29	26	2026-09-28 06:12:44	2026-09-30 03:41:22
f16443d0-1bb5-408b-a457-0443b37d4464	01a0e69e-1881-73b3-9dfc-701ffddf5816	S21	BOLT L	M10-40	STD	1		f	\N	\N	\N	\N	\N	\N	2026-09-29	28	2026-09-28 06:12:44	2026-09-30 03:41:22
5cd8a082-36df-4983-ba8b-d7e62baecadf	01a0e69e-1881-73b3-9dfc-701ffddf5816	S22	BOLT L	M10-60	STD	20		f	\N	\N	\N	\N	\N	\N	2026-09-29	29	2026-09-28 06:12:44	2026-09-30 03:41:22
02732532-8b97-460b-8baa-077ce0a34bd9	01a0e69e-1881-73b3-9dfc-701ffddf5816	S25	BOLT L	M12-40	STD	10		f	\N	\N	\N	\N	\N	\N	2026-09-29	32	2026-09-28 06:12:44	2026-09-30 03:41:22
a3ede37e-9b7d-433a-bf1a-fb6e3861f87f	01a0e69e-1881-73b3-9dfc-701ffddf5816	S26	BOLT L	M12-30	STD	10		f	\N	\N	\N	\N	\N	\N	2026-09-29	33	2026-09-28 06:12:44	2026-09-30 03:41:22
b3b35750-af26-4563-a308-51ac1c6344b0	01a0e69e-1881-73b3-9dfc-701ffddf5816	S6A	PUNCH PIE	SPAL 10-90-P8.05	STD	2		f	\N	\N	\N	\N	\N	\N	2026-10-01	7	2026-09-28 06:12:44	2026-09-30 03:44:52
98bf3893-f893-49e9-8fdc-807d733e5161	01a0e69e-1881-73b3-9dfc-701ffddf5816	S6B	PUNCH PIE	SPAL 10-90-P8.43	STD	3		f	\N	\N	\N	\N	\N	\N	2026-10-01	8	2026-09-28 06:12:44	2026-09-30 03:44:52
9edc5a02-cc74-46ff-bca5-8a188642b0cc	01a0e69e-1881-73b3-9dfc-701ffddf5816	S27	SHOULDER PUNCH	G-SPRL8-80-P7.20-W3.88-R1.04	STD	40		f	\N	\N	\N	\N	\N	\N	2026-10-08	34	2026-09-28 06:12:44	2026-09-30 03:48:21
df9aae9b-e7c0-464a-8323-b7db10dbff22	01a0eb56-6d89-7000-8199-cee6455b2569	01	TOP SHOE	30X400X500	SS400	1		f	\N	\N	\N	\N	\N	\N	\N	1	2026-09-30 07:35:16	2026-09-30 07:35:16
da2f3305-11e4-489f-ac68-014a20d1c0a4	01a0eb56-6d89-7000-8199-cee6455b2569	02	PH	30X100X100	S50C	1	35-40	f	\N	\N	\N	\N	\N	\N	\N	2	2026-09-30 07:35:16	2026-09-30 07:35:16
c12011a8-961c-4e54-bf74-b20279e6c424	01a0eb56-6d89-7000-8199-cee6455b2569	03	PUNCH BEND	79.5X60X100	SKD11	1	58-60	f	\N	\N	\N	\N	\N	\N	\N	3	2026-09-30 07:35:16	2026-09-30 07:35:16
14117cca-567a-4394-a4ab-d7e1ff23a78f	01a0eb56-6d89-7000-8199-cee6455b2569	04	DIE BEND	80X50X100	SKD11	2	58-60	f	\N	\N	\N	\N	\N	\N	\N	4	2026-09-30 07:35:16	2026-09-30 07:35:16
38b950e0-ab39-4b05-8a81-008cbc8864a3	01a0eb56-6d89-7000-8199-cee6455b2569	05	PAD/LIFTER	83X30X70	SKD11	1	58-60	f	\N	\N	\N	\N	\N	\N	\N	5	2026-09-30 07:35:16	2026-09-30 07:35:16
a41641fb-1ccd-4048-82f1-e5714aa1a31e	01a0eb56-6d89-7000-8199-cee6455b2569	06	HOLDER DIE	121X180X180	S50C	1		f	\N	\N	\N	\N	\N	\N	\N	6	2026-09-30 07:35:16	2026-09-30 07:35:16
f0a2f404-37fe-44b2-ac95-216de3cb2569	01a0eb56-6d89-7000-8199-cee6455b2569	07	BC DIE	30X180X180	SS400	1		f	\N	\N	\N	\N	\N	\N	\N	7	2026-09-30 07:35:16	2026-09-30 07:35:16
df1d0ba0-a668-4cc4-8dce-85e0f1f19a11	01a0eb56-6d89-7000-8199-cee6455b2569	08	STOPPER	5X42X53	MS	2		f	\N	\N	\N	\N	\N	\N	\N	8	2026-09-30 07:35:16	2026-09-30 07:35:16
d152d09b-cc91-4a8e-9c69-c5b40ac94c02	01a0eb56-6d89-7000-8199-cee6455b2569	09	BOTTOM SHOE	35X400X500	SS400	1		f	\N	\N	\N	\N	\N	\N	\N	9	2026-09-30 07:35:16	2026-09-30 07:35:16
45517df5-32c5-4ff5-8879-af2e23bad3c6	01a0eb56-6d89-7000-8199-cee6455b2569	10A	SP GUIDE POST SET UP	70X58X94	SS400	2		f	\N	\N	\N	\N	\N	\N	\N	10	2026-09-30 07:35:16	2026-09-30 07:35:16
0cb05da8-fbfc-437a-ab8c-a20e9fdb22b4	01a0eb56-6d89-7000-8199-cee6455b2569	10B	SP GUIDE POST SET DWN	45X58X94	SS400	2		f	\N	\N	\N	\N	\N	\N	\N	11	2026-09-30 07:35:16	2026-09-30 07:35:16
fa95f059-ec62-4a6f-b22b-443dde63f0c5	01a0eb56-6d89-7000-8199-cee6455b2569	11	END BLOCK UPPER	ø35-109	S50C	2	FLAME	f	\N	\N	\N	\N	\N	\N	\N	12	2026-09-30 07:35:16	2026-09-30 07:35:16
cf4dda31-9692-42c7-b213-d15834fbc72e	01a0eb56-6d89-7000-8199-cee6455b2569	12	END BLOCK LWR	ø35-80	S50C	2	FLAME	f	\N	\N	\N	\N	\N	\N	\N	13	2026-09-30 07:35:16	2026-09-30 07:35:16
6f1b08f9-5916-484a-ac1d-c00bae77681b	01a0eb56-6d89-7000-8199-cee6455b2569	13	END BLOCK CTR	ø35-30	S50C	2		f	\N	\N	\N	\N	\N	\N	\N	14	2026-09-30 07:35:16	2026-09-30 07:35:16
df97c2fa-9638-4605-903b-aee165fac6c2	01a0eb56-6d89-7000-8199-cee6455b2569	14	HOOK	CHP 20	SS400	8		f	\N	\N	\N	\N	\N	\N	\N	15	2026-09-30 07:35:16	2026-09-30 07:35:16
9eeb94bc-588e-4f97-8b45-caa33f41cd79	01a0eb56-6d89-7000-8199-cee6455b2569	01	TOP SHOE	30X400X500	SS400	1		f	\N	\N	\N	\N	\N	\N	\N	16	2026-09-30 08:18:01	2026-09-30 08:18:01
81bfad5a-5add-481c-8151-4895a260f47f	01a0eb56-6d89-7000-8199-cee6455b2569	02	PH	30X100X100	S50C	1	35-40	f	\N	\N	\N	\N	\N	\N	\N	17	2026-09-30 08:18:02	2026-09-30 08:18:02
4cde01ea-8242-4727-8efc-42c6bee678bf	01a0eb56-6d89-7000-8199-cee6455b2569	03	PUNCH BEND	79.5X60X100	SKD11	1	58-60	f	\N	\N	\N	\N	\N	\N	\N	18	2026-09-30 08:18:02	2026-09-30 08:18:02
81995e94-ed48-4798-b915-e45ca2d1cede	01a0eb56-6d89-7000-8199-cee6455b2569	04	DIE BEND	80X50X100	SKD11	2	58-60	f	\N	\N	\N	\N	\N	\N	\N	19	2026-09-30 08:18:02	2026-09-30 08:18:02
65a3f531-3a26-403c-a76d-e27fe705034a	01a0eb56-6d89-7000-8199-cee6455b2569	05	PAD/LIFTER	83X30X70	SKD11	1	58-60	f	\N	\N	\N	\N	\N	\N	\N	20	2026-09-30 08:18:02	2026-09-30 08:18:02
3b8e497d-b662-48d1-b1e1-31fc53b3c309	01a0eb56-6d89-7000-8199-cee6455b2569	06	HOLDER DIE	121X180X180	S50C	1		f	\N	\N	\N	\N	\N	\N	\N	21	2026-09-30 08:18:02	2026-09-30 08:18:02
320797a3-ca84-4e59-a036-a45952c725f3	01a0eb56-6d89-7000-8199-cee6455b2569	07	BC DIE	30X180X180	SS400	1		f	\N	\N	\N	\N	\N	\N	\N	22	2026-09-30 08:18:02	2026-09-30 08:18:02
d5538177-814b-49a4-bddc-bb5494d15d3f	01a0eb56-6d89-7000-8199-cee6455b2569	08	STOPPER	5X42X53	MS	2		f	\N	\N	\N	\N	\N	\N	\N	23	2026-09-30 08:18:02	2026-09-30 08:18:02
ef51fa11-3d2d-43bf-9b19-fa828e3f6b28	01a0eb56-6d89-7000-8199-cee6455b2569	09	BOTTOM SHOE	35X400X500	SS400	1		f	\N	\N	\N	\N	\N	\N	\N	24	2026-09-30 08:18:02	2026-09-30 08:18:02
9eca8e61-bc8e-4797-9403-32a429a89c14	01a0eb56-6d89-7000-8199-cee6455b2569	10A	SP GUIDE POST SET UP	70X58X94	SS400	2		f	\N	\N	\N	\N	\N	\N	\N	25	2026-09-30 08:18:02	2026-09-30 08:18:02
a2621639-6cce-401f-8fcd-6ac47cdb91c7	01a0eb56-6d89-7000-8199-cee6455b2569	10B	SP GUIDE POST SET DWN	45X58X94	SS400	2		f	\N	\N	\N	\N	\N	\N	\N	26	2026-09-30 08:18:02	2026-09-30 08:18:02
696e3003-c755-4f9f-971b-5fbce50af198	01a0eb56-6d89-7000-8199-cee6455b2569	11	END BLOCK UPPER	PH35-109	S50C	2	FLAME	f	\N	\N	\N	\N	\N	\N	\N	27	2026-09-30 08:18:02	2026-09-30 08:18:02
fe6643e6-51f0-4cff-a8e9-b22225d6ff38	01a0eb56-6d89-7000-8199-cee6455b2569	12	END BLOCK LWR	PH35-80	S50C	2	FLAME	f	\N	\N	\N	\N	\N	\N	\N	28	2026-09-30 08:18:02	2026-09-30 08:18:02
41ea2782-50dd-4558-a5ba-9a6b76b8b0a6	01a0eb56-6d89-7000-8199-cee6455b2569	13	END BLOCK CTR	PH35-30	S50C	2		f	\N	\N	\N	\N	\N	\N	\N	29	2026-09-30 08:18:02	2026-09-30 08:18:02
605db17f-f07c-4750-9a7b-f75d69750b07	01a0eb56-6d89-7000-8199-cee6455b2569	14	HOOK	CHP 20	SS400	8		f	\N	\N	\N	\N	\N	\N	\N	30	2026-09-30 08:18:02	2026-09-30 08:18:02
e2d75cb9-faba-4d9a-b87f-06ece853b82d	01a0e69e-1881-73b3-9dfc-701ffddf5816	S13	SPRING	SWB 30-70	STD	10		f	\N	\N	\N	\N	\N	\N	\N	20	2026-09-28 06:12:44	2026-09-28 06:12:44
f3e08642-919c-4f60-bc34-0d76ac4723b8	01a0e69e-1881-73b3-9dfc-701ffddf5816	S15	PIN	MSTH 10-40	STD	4		f	\N	\N	\N	\N	\N	\N	\N	22	2026-09-28 06:12:44	2026-09-28 06:12:44
73113411-a91b-46fa-8f06-2a3487b1cf68	01a0e69e-1881-73b3-9dfc-701ffddf5816	S17	PIN	MSTH 8-50	STD	6		f	\N	\N	\N	\N	\N	\N	\N	24	2026-09-28 06:12:44	2026-09-28 06:12:44
5adfc0f5-0034-4a88-a787-fdee577e4839	01a0e69e-1881-73b3-9dfc-701ffddf5816	S18	HOOK	CHP 16	STD	8		f	\N	\N	\N	\N	\N	\N	\N	25	2026-09-28 06:12:44	2026-09-28 06:12:44
6d10370a-2ba6-4017-86a1-15e9bcaf1f3c	01a0e69e-1881-73b3-9dfc-701ffddf5816	S20	BOLT L	M8-35	STD	12		f	\N	\N	\N	\N	\N	\N	\N	27	2026-09-28 06:12:44	2026-09-28 06:12:44
5edb64e7-e25b-410f-baf3-df77f51c8fe2	01a0e69e-1881-73b3-9dfc-701ffddf5816	S23	BOLT L	M8-40	STD	12		f	\N	\N	\N	\N	\N	\N	\N	30	2026-09-28 06:12:44	2026-09-28 06:12:44
d44598bf-8f95-41aa-bd24-ce5a8f132a82	01a0e69e-1881-73b3-9dfc-701ffddf5816	S24	BOLT L	M6-20	STD	8		f	\N	\N	\N	\N	\N	\N	\N	31	2026-09-28 06:12:44	2026-09-28 06:12:44
41d35a4d-475e-425d-9091-8f4720b9c1b7	01a0e69e-1880-73ba-8d90-ca32f2f69b46	04	DIE LWR	35X200X200	SKD11	1	58-60	t	\N	PUTRA	In Progress	Wirecut	2026-09-30 02:56:12	\N	2026-10-01	4	2026-09-28 06:13:43	2026-09-30 02:56:12
daf585e6-8461-4cb9-b830-b415f8ce0a0b	01a0e69e-1880-73ba-8d90-ca32f2f69b46	06	BOTTOM SHOE	40X300X410	SS400	1		f	\N	\N	\N	\N	\N	\N	\N	6	2026-09-28 06:13:43	2026-09-28 06:13:43
b466fd85-11e4-4188-a162-b9abda95fbbf	01a0e69e-1880-73ba-8d90-ca32f2f69b46	07	MAKURA	40X104.5X300	SS400	3		f	\N	\N	\N	\N	\N	\N	\N	7	2026-09-28 06:13:43	2026-09-28 06:13:43
d8983675-f1b3-4e21-9316-f9103659eb00	01a0e69e-1880-73ba-8d90-ca32f2f69b46	08	LOWER CLAMPING	30X300X550	SS400	1		f	\N	\N	\N	\N	\N	\N	\N	8	2026-09-28 06:13:43	2026-09-28 06:13:43
d41cbe4e-b4af-4362-be98-db0cc943fa90	01a0e69e-1880-73ba-8d90-ca32f2f69b46	09	PUNCH COINNING LWR 1	40X30X200	SKD11	1	58-60	f	\N	\N	\N	\N	\N	\N	\N	9	2026-09-28 06:13:43	2026-09-28 06:13:43
7f4cbc24-82ef-4d6e-84c3-7a6fdcf40ac1	01a0e69e-1880-73ba-8d90-ca32f2f69b46	10	GUIDE	30X30X41	SKS3	1	56-58	f	\N	\N	\N	\N	\N	\N	\N	10	2026-09-28 06:13:43	2026-09-28 06:13:43
4bc35b1c-e5d6-4abc-958c-4382a4e5ed5a	01a0e69e-1880-73ba-8d90-ca32f2f69b46	11	LIFTER	69-35	SKS3	1	56-58	f	\N	\N	\N	\N	\N	\N	\N	11	2026-09-28 06:13:43	2026-09-28 06:13:43
9206e5c3-f52c-4d17-887b-3ecd37f51d24	01a0e69e-1880-73ba-8d90-ca32f2f69b46	12	END BLOK UPPR	&-60	S50C	2		f	\N	\N	\N	\N	\N	\N	\N	12	2026-09-28 06:13:43	2026-09-28 06:13:43
a38bfdf9-d7c5-4da8-9414-50670e0f2ac7	01a0e69e-1880-73ba-8d90-ca32f2f69b46	13	END BLOK LWR	&-50.5	S50C	2		f	\N	\N	\N	\N	\N	\N	\N	13	2026-09-28 06:13:43	2026-09-28 06:13:43
a5e2bad7-28d2-4acb-ac73-bde5965ad096	01a0e69e-1882-7124-b62a-9c152c52a842	S6	BOLT L	M8-35	STD	8		f	\N	\N	\N	\N	\N	\N	\N	6	2026-09-28 06:14:25	2026-09-28 06:14:25
1a5f8599-a44e-42fc-ba92-0acfbee4f1fa	01a0e69e-1882-7124-b62a-9c152c52a842	S7	BOLT L	M8-60	STD	12		f	\N	\N	\N	\N	\N	\N	\N	7	2026-09-28 06:14:25	2026-09-28 06:14:25
8cd5a875-143c-4c1f-a33c-53b927dcda08	01a0e69e-1882-7124-b62a-9c152c52a842	S8	BOLT L	M12-40	STD	6		f	\N	\N	\N	\N	\N	\N	\N	8	2026-09-28 06:14:25	2026-09-28 06:14:25
e9c36345-0b23-4faf-b96c-909c5dfccd74	01a0e69e-1882-7124-b62a-9c152c52a842	S9	BOLT L	M12-30	STD	6		f	\N	\N	\N	\N	\N	\N	\N	9	2026-09-28 06:14:25	2026-09-28 06:14:25
bb2b6290-14c4-440b-b595-bffca5fb921f	01a0e69e-1880-73ba-8d90-ca32f2f69b46	02	BC UPPR	20X200X200	S50C	1		f	\N	\N	\N	\N	\N	\N	2026-09-25	2	2026-09-28 06:13:43	2026-09-28 08:01:36
cfa9cb0f-804a-47a2-9d4f-4099d5b79497	01a0e69e-1880-73ba-8d90-ca32f2f69b46	05	BC DIE LWR	20X200X200	S50C	1	35-40	t	\N	KANETSU	In Progress	Hardening	2026-09-30 02:57:31	\N	\N	5	2026-09-28 06:13:43	2026-09-30 02:57:31
cf71fa72-2495-493f-b838-9dade17b12dd	01a0e69e-1881-73b3-9dfc-701ffddf5816	S7	GAS SPRING	GSV 1500-25	STD	1		f	\N	\N	\N	\N	\N	\N	2026-09-29	9	2026-09-28 06:12:44	2026-09-30 03:41:22
646bdcc3-ba1b-4e43-b099-7858b44f0e11	01a0e69e-1881-73b3-9dfc-701ffddf5816	S8	STRIPPER BOLT	CSR 13-75	STD	3		f	\N	\N	\N	\N	\N	\N	2026-09-29	10	2026-09-28 06:12:44	2026-09-30 03:41:22
f0b48a56-bf66-4583-a585-fc5318266d8c	01a0e69e-1881-73b3-9dfc-701ffddf5816	S9A	PILOT PIN	SPT 8-37-P8.0	STD	6		f	\N	\N	\N	\N	\N	\N	2026-09-29	11	2026-09-28 06:12:44	2026-09-30 03:41:22
a92f8656-82b9-4264-b4cf-d1efb98568d1	01a0e69e-1881-73b3-9dfc-701ffddf5816	S9B	PILOT PIN	SPT 10-37-P8.45	STD	6		f	\N	\N	\N	\N	\N	\N	2026-09-29	12	2026-09-28 06:12:44	2026-09-30 03:41:22
afe15676-56ea-4150-986c-ab7f9b399df2	01a0e69e-1881-73b3-9dfc-701ffddf5816	S10A	PILOT PIN	STC 8-42-P8.0	STD	4		f	\N	\N	\N	\N	\N	\N	2026-09-29	13	2026-09-28 06:12:44	2026-09-30 03:41:22
b8857226-a129-4f1c-a994-22eebb2e7aa6	01a0e69e-1881-73b3-9dfc-701ffddf5816	S10B	PILOT PIN	STC 10-42-P8.45	STD	3		f	\N	\N	\N	\N	\N	\N	2026-09-29	14	2026-09-28 06:12:44	2026-09-30 03:41:22
7b0361ed-8d29-4c5e-9b3d-47f0ea4b7e20	01a0e69e-1881-73b3-9dfc-701ffddf5816	S10B.1	PILOT PIN	STC 10-60-P8.45	STD	3		f	\N	\N	\N	\N	\N	\N	2026-09-29	15	2026-09-28 06:12:44	2026-09-30 03:41:22
b4b2e916-5dc6-4ebb-bad8-ed52b397b525	01a0e69e-1881-73b3-9dfc-701ffddf5816	S11A	GUIDE LIFTER	GLP 16-45-2.5	STD	10		f	\N	\N	\N	\N	\N	\N	2026-09-29	16	2026-09-28 06:12:44	2026-09-30 03:41:22
23c648f7-2f0c-49eb-b66f-6302b23d49cb	01a0e69e-1881-73b3-9dfc-701ffddf5816	S11B	SPRING	SWF 18-65	STD	10		f	\N	\N	\N	\N	\N	\N	2026-09-29	17	2026-09-28 06:12:44	2026-09-30 03:41:22
2ac2c9f4-8330-40a4-adbf-fda115c57c87	01a0e69e-1881-73b3-9dfc-701ffddf5816	S11C	SCREW PLUG	MSW 22	STD	10		f	\N	\N	\N	\N	\N	\N	2026-09-29	18	2026-09-28 06:12:44	2026-09-30 03:41:22
1c87a74b-6a25-4c4d-b873-03365bec15eb	01a0e69e-1881-73b3-9dfc-701ffddf5816	S12A	STRIPPER GUIDE PIN	SGPH 20-90	STD	4		f	\N	\N	\N	\N	\N	\N	2026-09-29	19	2026-09-28 06:12:44	2026-09-30 03:41:22
17d90512-1a81-45b8-ac46-1a1bdf47db45	01a0e69e-1882-7124-b62a-9c152c52a842	S1	GUIDE POST SET	MYP 32-120	STD	2		f	\N	\N	\N	\N	\N	\N	2026-09-29	1	2026-09-28 06:14:25	2026-09-30 03:51:36
115dac39-f0e2-4fe0-9a88-3a02ba8abde5	01a0e69e-1882-7124-b62a-9c152c52a842	S2	PUNCH KOINNING LWR 2	SPB 10-60	STD	3		f	\N	\N	\N	\N	\N	\N	2026-09-29	2	2026-09-28 06:14:25	2026-09-30 03:51:36
df0f7659-199f-4825-9668-066fdf8488aa	01a0e69e-1882-7124-b62a-9c152c52a842	S3	STRIPPER GUIDE PIN	SGPH 20-60	STD	4		f	\N	\N	\N	\N	\N	\N	2026-09-29	3	2026-09-28 06:14:25	2026-09-30 03:51:36
b0a35819-4f2a-472c-8e4d-c6e8d6f01a6b	01a0e69e-1882-7124-b62a-9c152c52a842	S4	STRIPPER BOLT	MSB 13-25	STD	1		f	\N	\N	\N	\N	\N	\N	2026-09-29	4	2026-09-28 06:14:25	2026-09-30 03:51:36
b383b554-431a-4029-a21f-7182a7f701c5	01a0e69e-1882-7124-b62a-9c152c52a842	S5	PIN	MSTH 8-5	STD	4		f	\N	\N	\N	\N	\N	\N	2026-09-29	5	2026-09-28 06:14:25	2026-09-30 03:51:36
f74c6233-4387-44a0-b469-aa585fc05766	01a0e69e-1882-7124-b62a-9c152c52a842	S10	LIFTER	SPB 3-50	STD	6		f	\N	\N	\N	\N	\N	\N	2026-09-29	10	2026-09-28 06:14:25	2026-09-30 03:51:36
51ba7d45-45a5-4688-8e4e-a9b7098a2dc2	01a0e69e-1882-7124-b62a-9c152c52a842	S11	SPRING	SWM 6-60	STD	6		f	\N	\N	\N	\N	\N	\N	2026-09-29	11	2026-09-28 06:14:25	2026-09-30 03:51:36
941ec030-bfc2-4a65-a116-f230c0d9846b	01a0e69e-1882-7124-b62a-9c152c52a842	S12	SCREW PLUG	MSW 8	STD	6		f	\N	\N	\N	\N	\N	\N	2026-09-29	12	2026-09-28 06:14:25	2026-09-30 03:51:36
1e0b09f0-2be4-4451-8619-c63e62949065	01a0f12c-ae94-7137-bfb2-4ea3596651db	2	Bracket 1	15x22x55	S50C	2		f	\N	\N	\N	\N	\N	\N	\N	2	2026-09-30 07:20:33	2026-09-30 07:20:33
0d7d9f7d-e752-430b-95a3-ab0c3422c093	01a0f12c-ae94-7137-bfb2-4ea3596651db	3	Stand Dial	10x9x70	S50C	2		f	\N	\N	\N	\N	\N	\N	\N	3	2026-09-30 07:20:33	2026-09-30 07:20:33
a06d3f3e-30ac-4bcc-a186-5dd9b046134f	01a0f12c-ae94-7137-bfb2-4ea3596651db	4	Lokator Center	66x5	S50C	2		f	\N	\N	\N	\N	\N	\N	\N	4	2026-09-30 07:20:33	2026-09-30 07:20:33
a3ee7974-a997-48f5-9944-3efd8c14a4a7	01a0f12c-ae94-7137-bfb2-4ea3596651db	1	Base Plate	20x150x300	S50C	2		f	\N	\N	\N	\N	\N	\N	2026-10-01	1	2026-09-30 07:20:33	2026-09-30 07:25:01
a79f29b4-9241-4c07-91fd-5f53c75ac8d9	01a0eb56-6d8b-72f1-a3b9-8400edf9c566	S1	GUIDE POST SET	MYP 25-100	STD	2		f	\N	\N	\N	\N	\N	\N	\N	1	2026-09-30 08:19:16	2026-09-30 08:19:16
f520221d-46df-47e4-b0c3-5f1542ad1426	01a0eb56-6d8b-72f1-a3b9-8400edf9c566	S2	SPRING	SWL 22-100	STD	2		f	\N	\N	\N	\N	\N	\N	\N	2	2026-09-30 08:19:16	2026-09-30 08:19:16
a9ba7db7-175b-4098-a799-05fe2bd3838a	01a0eb56-6d8b-72f1-a3b9-8400edf9c566	S3	PIN	MSTH 10-40	STD	4		f	\N	\N	\N	\N	\N	\N	\N	3	2026-09-30 08:19:16	2026-09-30 08:19:16
8bcece61-ab1b-4f83-ba6a-a26b46ad0d5f	01a0eb56-6d8b-72f1-a3b9-8400edf9c566	S4	PIN	MSTH 10-50	STD	2		f	\N	\N	\N	\N	\N	\N	\N	4	2026-09-30 08:19:16	2026-09-30 08:19:16
0df7b62c-d6f7-47a2-89a9-0369c134fa30	01a0eb56-6d8b-72f1-a3b9-8400edf9c566	S5	PIN	MSTH 8-40	STD	12		f	\N	\N	\N	\N	\N	\N	\N	5	2026-09-30 08:19:16	2026-09-30 08:19:16
78ee738f-5994-4db3-ac25-994effe2253e	01a0eb56-6d8b-72f1-a3b9-8400edf9c566	S6	PIN	MSTH 6-20	STD	4		f	\N	\N	\N	\N	\N	\N	\N	6	2026-09-30 08:19:16	2026-09-30 08:19:16
386513b8-3a03-49b2-9d26-be9e8c4925f5	01a0eb56-6d8b-72f1-a3b9-8400edf9c566	S7	SELING	φ0.5-500	STD	1		f	\N	\N	\N	\N	\N	\N	\N	7	2026-09-30 08:19:16	2026-09-30 08:19:16
494a6ad7-edbf-4677-a0c0-7c123689f57e	01a0eb56-6d8b-72f1-a3b9-8400edf9c566	S8	WASHER	MW 25	STD	4		f	\N	\N	\N	\N	\N	\N	\N	8	2026-09-30 08:19:16	2026-09-30 08:19:16
1120a6ca-5d7d-4551-865b-fa659f3bc071	01a0e69e-1880-73ba-8d90-ca32f2f69b46	01	TOP SHOE	35X300X500	SS400	1		f	\N	\N	\N	\N	\N	\N	\N	1	2026-09-28 06:13:43	2026-09-28 06:13:43
e953e46f-9b7c-4472-b54f-5b655218d956	01a0e69e-1879-7204-a5cb-09abb3318484	12	INS DIE BLOCK 1	30X114.5X116	SKD11	1	58-60	t	\N	CHIYODA	In Progress	Hardening	2026-09-30 02:59:40	\N	\N	17	2026-09-28 06:10:32	2026-09-30 02:59:40
4f093c41-2538-48da-aec7-60532b637196	01a0e69e-1880-73ba-8d90-ca32f2f69b46	03	DIE UPPR	35X200X200	SKD11	1	58-60	f	\N	\N	\N	\N	\N	\N	\N	3	2026-09-28 06:13:43	2026-09-28 06:13:43
d3bae093-04b1-4777-a223-ff8814ec1c80	01a0f12b-98ae-7266-b835-b558fafc00b9	3	Pin	ø10x25	SKD11	6	—	f	\N	\N	\N	\N	\N	\N	\N	1	2026-09-30 07:21:56	2026-09-30 07:21:56
01369c40-5682-4e29-992c-ed12dbe65121	01a0f12b-98ae-7266-b835-b558fafc00b9	2	Lokator Center	ø66x10	SKD11	2	—	f	\N	\N	\N	\N	\N	\N	\N	2	2026-09-30 07:21:56	2026-09-30 07:21:56
a6b080af-8525-4373-b28a-d59375af9a5d	01a0f12b-98ae-7266-b835-b558fafc00b9	1	Lokator	23x150x150	SKD11	2	58±2	f	\N	\N	\N	\N	\N	\N	\N	3	2026-09-30 07:21:56	2026-09-30 07:21:56
543f006d-0411-4f51-8c96-a49b97482346	01a0f140-68ad-736b-bc30-76e7e19a319e	01	TOP SHOE	35X400X550	SS400	1		f	\N	\N	\N	\N	\N	\N	\N	1	2026-09-30 07:43:17	2026-09-30 07:43:17
81b8af3c-8ad4-40c9-9a64-d7ba0a5b5a90	01a0f140-68ad-736b-bc30-76e7e19a319e	02	SUPPORT PUNCH BENDING 1	50X80X124	SS400	2		f	\N	\N	\N	\N	\N	\N	\N	2	2026-09-30 07:43:17	2026-09-30 07:43:17
daeaa86f-366e-4675-b53e-658833f4ec09	01a0f140-68ad-736b-bc30-76e7e19a319e	03	BACKING 1	21.8X67X80	SS400	1		f	\N	\N	\N	\N	\N	\N	\N	3	2026-09-30 07:43:17	2026-09-30 07:43:17
13d42e6c-3106-455d-86c9-1d985284edbd	01a0f140-68ad-736b-bc30-76e7e19a319e	04	PAD 1	77X67X80	SS400	1		f	\N	\N	\N	\N	\N	\N	\N	4	2026-09-30 07:43:17	2026-09-30 07:43:17
fdd0e25a-91f2-4820-86dc-4f1cbbc4c9fe	01a0f140-68ad-736b-bc30-76e7e19a319e	05	PUNCH BENDING 1	20X40X80	SKD11	2	58-60	f	\N	\N	\N	\N	\N	\N	\N	5	2026-09-30 07:43:17	2026-09-30 07:43:17
0a8e7a90-f291-452e-8e94-d14a65db32b5	01a0f140-68ad-736b-bc30-76e7e19a319e	06	DIE BENDING 1	30X69.6X75	SKD11	1	58-60	f	\N	\N	\N	\N	\N	\N	\N	6	2026-09-30 07:43:17	2026-09-30 07:43:17
36bb148e-72d1-4a79-ae1d-7677e1fe9c30	01a0f140-68ad-736b-bc30-76e7e19a319e	07	BACKING DIE 1	45X69.6X75	SS400	1		f	\N	\N	\N	\N	\N	\N	\N	7	2026-09-30 07:43:17	2026-09-30 07:43:17
c1077155-07b8-452e-b02c-a702b44bef52	01a0f140-68ad-736b-bc30-76e7e19a319e	08	SUPPORT DIE 1	30X75X120	SS400	1		f	\N	\N	\N	\N	\N	\N	\N	8	2026-09-30 07:43:17	2026-09-30 07:43:17
cc1c421d-d01a-4c66-97e3-e55f41312f47	01a0f140-68ad-736b-bc30-76e7e19a319e	09	BACKING PUNCH 2	20X130X140	S50C	1	35-40	f	\N	\N	\N	\N	\N	\N	\N	9	2026-09-30 07:43:17	2026-09-30 07:43:17
f08e0334-48a1-4ee6-8165-a98b85f356bc	01a0f140-68ad-736b-bc30-76e7e19a319e	10	PUNCH HOLDER	25X130X140	S50C	1		f	\N	\N	\N	\N	\N	\N	\N	10	2026-09-30 07:43:17	2026-09-30 07:43:17
8564ca28-a341-4744-b26e-699197adca8f	01a0f140-68ad-736b-bc30-76e7e19a319e	11	STRIPPER	25X130X140	S50C	1		f	\N	\N	\N	\N	\N	\N	\N	11	2026-09-30 07:43:17	2026-09-30 07:43:17
d9865371-9705-4096-ba2a-33bef025cf0a	01a0f140-68ad-736b-bc30-76e7e19a319e	12	DIE SPARATING	30X69.6X100	SKD11	1	58-60	f	\N	\N	\N	\N	\N	\N	\N	12	2026-09-30 07:43:17	2026-09-30 07:43:17
6d02a17a-52dd-407c-a26a-4d058b9c8903	01a0f140-68ad-736b-bc30-76e7e19a319e	13	BACKING DIE	30X130X140	SS400	1		f	\N	\N	\N	\N	\N	\N	\N	13	2026-09-30 07:43:17	2026-09-30 07:43:17
5d1d8e1a-d6b4-4ec1-ba86-0acc67fce08a	01a0f140-68ad-736b-bc30-76e7e19a319e	14	SPACER	30X45X140	SS400	2		f	\N	\N	\N	\N	\N	\N	\N	14	2026-09-30 07:43:17	2026-09-30 07:43:17
52bb3a42-f6b1-4f03-832f-ce664d03f9b2	01a0f140-68ad-736b-bc30-76e7e19a319e	15	BOTTOM SHOE	35X400X550	SS400	1		f	\N	\N	\N	\N	\N	\N	\N	15	2026-09-30 07:43:17	2026-09-30 07:43:17
f9a84bdd-15c6-49a0-b3c1-be633be4ec1b	01a0e69e-1879-7204-a5cb-09abb3318484	13	INS DIE BLOCK 2	30X114.5X110	SKD11	1	58-60	t	\N	CHIYODA	In Progress	Hardening	2026-09-29 05:54:05	\N	\N	18	2026-09-28 06:10:32	2026-09-29 05:54:05
205c6252-450a-48c2-97ab-a5eef7f58635	01a0f140-68ad-736b-bc30-76e7e19a319e	16	PUNCH SPARATING	15X46X84	SKD11	1	58-60	f	\N	\N	\N	\N	\N	\N	\N	16	2026-09-30 07:43:17	2026-09-30 07:43:17
7665747c-6bb8-49d5-8602-d23f5638a6e1	01a0f140-68ad-736b-bc30-76e7e19a319e	17	UPPER END BLOCK	DIA 35X100	SS400	2		f	\N	\N	\N	\N	\N	\N	\N	17	2026-09-30 07:43:17	2026-09-30 07:43:17
22d77139-cd23-4862-944c-f6de14acd71e	01a0f140-68ad-736b-bc30-76e7e19a319e	18a	LOWER END BLOCK A	DIA 35X40	SS400	2		f	\N	\N	\N	\N	\N	\N	\N	18	2026-09-30 07:43:17	2026-09-30 07:43:17
e2096ae3-8c4e-4031-a2f5-7b4cd7930157	01a0f140-68ad-736b-bc30-76e7e19a319e	18b	LOWER END BLOCK B	DIA 35X65	SS400	2		f	\N	\N	\N	\N	\N	\N	\N	19	2026-09-30 07:43:17	2026-09-30 07:43:17
97143831-58e6-4cf3-830a-86b16d468ac9	01a0f140-68ad-736b-bc30-76e7e19a319e	19	LOWER SUPPORT GUIDE POST	35X54X94	SS400	2		f	\N	\N	\N	\N	\N	\N	\N	20	2026-09-30 07:43:17	2026-09-30 07:43:17
baa1e370-15f1-4b96-94d1-afd46932997c	01a0f140-68ad-736b-bc30-76e7e19a319e	20	UPPER SUPPORT GUIDE POST	50X54X94	SS400	2		f	\N	\N	\N	\N	\N	\N	\N	21	2026-09-30 07:43:17	2026-09-30 07:43:17
e8509622-d30d-403d-9ad3-11ed32de0a36	01a0f140-68ad-736b-bc30-76e7e19a319e	21	PLATE	20X65X120	S50C	2	35-40	f	\N	\N	\N	\N	\N	\N	\N	22	2026-09-30 07:43:17	2026-09-30 07:43:17
36dc892a-1a16-4413-a095-e54a75acfb0c	01a0e69e-1879-7204-a5cb-09abb3318484	01	TOP SHOE	40X500X850	SS400	1	-	f	\N	\N	\N	\N	\N	\N	\N	1	2026-09-28 06:10:32	2026-09-28 06:10:32
f698a227-ba55-403f-ae7b-df910acb54e4	01a0e69e-1879-7204-a5cb-09abb3318484	02A	BC PH 1	35X270X440	2311	1	30-35	f	\N	\N	\N	\N	\N	\N	\N	2	2026-09-28 06:10:32	2026-09-28 06:10:32
503d6a55-e111-471e-8174-a4d380da26ed	01a0e69e-1879-7204-a5cb-09abb3318484	03A	PH1	30X270X440	S50C	1	-	f	\N	\N	\N	\N	\N	\N	\N	3	2026-09-28 06:10:32	2026-09-28 06:10:32
afdba3e1-2ee5-48c2-93f0-841d90836ea4	01a0e69e-1879-7204-a5cb-09abb3318484	03B	BACKING PUNCH 2	50X270X287	SS400	1	-	f	\N	\N	\N	\N	\N	\N	\N	4	2026-09-28 06:10:32	2026-09-28 06:10:32
cac7ff99-9be1-49a7-bc58-5abe3d381c15	01a0e69e-1879-7204-a5cb-09abb3318484	04A	BC STRIPPER 1	15X270X440	S50C	1	-	f	\N	\N	\N	\N	\N	\N	\N	5	2026-09-28 06:10:32	2026-09-28 06:10:32
9f8d9795-98f2-44ae-98f4-ca89e30d8be9	01a0e69e-1879-7204-a5cb-09abb3318484	04A	PUNCH HOLDER 2	20X270X287	2311	1	30-35	f	\N	\N	\N	\N	\N	\N	\N	6	2026-09-28 06:10:32	2026-09-28 06:10:32
52cd700c-70b3-4878-b80f-beea372e835a	01a0e69e-1879-7204-a5cb-09abb3318484	05A	STRIPPER 1	30X270X440	2311	1	30-35	f	\N	\N	\N	\N	\N	\N	\N	7	2026-09-28 06:10:32	2026-09-28 06:10:32
6a5ba01a-21bf-41bb-aad2-a2d038ccbfac	01a0e69e-1879-7204-a5cb-09abb3318484	05B	DIE BLANK	40X270X287	SKD11	1	58-60	f	\N	\N	\N	\N	\N	\N	\N	8	2026-09-28 06:10:32	2026-09-28 06:10:32
177b954d-7956-4601-a7de-51c0171533a9	01a0e69e-1879-7204-a5cb-09abb3318484	06A	DIE 1	30X270X440	2311	1	30-35	f	\N	\N	\N	\N	\N	\N	\N	9	2026-09-28 06:10:32	2026-09-28 06:10:32
9ef3823d-c8c6-4a47-9ec7-bbcbf4be5cda	01a0e69e-1879-7204-a5cb-09abb3318484	06B	PAD	30X290X287	2311	1	30-35	f	\N	\N	\N	\N	\N	\N	\N	10	2026-09-28 06:10:32	2026-09-28 06:10:32
817f248e-5c37-49e9-98cd-1be2ee327184	01a0e69e-1879-7204-a5cb-09abb3318484	07A	BACKING DIE 1	35X270X440	2311	1	30-35	f	\N	\N	\N	\N	\N	\N	\N	11	2026-09-28 06:10:32	2026-09-28 06:10:32
6196d091-466f-4fbb-9380-a091f92fbba1	01a0e69e-1879-7204-a5cb-09abb3318484	07B	LOWER HOLDER	25X270X287	2311	1	30-35	f	\N	\N	\N	\N	\N	\N	\N	12	2026-09-28 06:10:32	2026-09-28 06:10:32
2b29e893-fe7f-4c5d-9d95-af0939452d93	01a0e69e-1879-7204-a5cb-09abb3318484	08	BOTTOM SHOE	50X500X850	SS400	1	-	f	\N	\N	\N	\N	\N	\N	\N	13	2026-09-28 06:10:32	2026-09-28 06:10:32
7c4f6300-c3b3-4162-954e-15687df523f3	01a0e69e-1879-7204-a5cb-09abb3318484	09	MAKURA	40X128X50	SS400	4	-	f	\N	\N	\N	\N	\N	\N	\N	14	2026-09-28 06:10:32	2026-09-28 06:10:32
da7fd30f-070a-4709-acf1-26d8cc3f2377	01a0e69e-1879-7204-a5cb-09abb3318484	10	LOWER CLAMPING PLATE	30X500X950	SS400	1	-	f	\N	\N	\N	\N	\N	\N	\N	15	2026-09-28 06:10:32	2026-09-28 06:10:32
396e0856-ee18-4de1-86ad-e5e34459f404	01a0e69e-1879-7204-a5cb-09abb3318484	11	INS DIE PIE	30X24X38	SKD11	2	58-60	f	\N	\N	\N	\N	\N	\N	\N	16	2026-09-28 06:10:32	2026-09-28 06:10:32
8932b698-e137-422c-ae4b-143bdfbd2333	01a0e69e-1879-7204-a5cb-09abb3318484	14	INS DIE BLOCK 3	30X114.5X110	SKD11	1	58-60	f	\N	\N	\N	\N	\N	\N	\N	19	2026-09-28 06:10:32	2026-09-28 06:10:32
3ab5d794-bd6d-431d-ad61-57379487e3ac	01a0e69e-1879-7204-a5cb-09abb3318484	15	PUNCH BLANK	TOMODORI NO 05B	SKD11	1	58-60	f	\N	\N	\N	\N	\N	\N	\N	20	2026-09-28 06:10:32	2026-09-28 06:10:32
81977c8e-7cf1-4bdc-bbce-f72c9a1e000b	01a0e69e-1879-7204-a5cb-09abb3318484	16	PUNCH PIE	Ø66-80	SKD11	1	58-60	f	\N	\N	\N	\N	\N	\N	\N	21	2026-09-28 06:10:32	2026-09-28 06:10:32
dfe83c86-4089-4b3e-a180-96fe9ca100a7	01a0e69e-1879-7204-a5cb-09abb3318484	19	STOPPER	15X20X50	SKS3	4	54-56	f	\N	\N	\N	\N	\N	\N	\N	22	2026-09-28 06:10:32	2026-09-28 06:10:32
1c56a718-c766-41bd-98e1-c9dcf6769c69	01a0e69e-1879-7204-a5cb-09abb3318484	20	HEEL	35X100X68	S50C	2	FLAME HARD	f	\N	\N	\N	\N	\N	\N	\N	23	2026-09-28 06:10:32	2026-09-28 06:10:32
01e7ad73-9069-4bae-87c9-3e728d94bf12	01a0e69e-1879-7204-a5cb-09abb3318484	21	END BLOCK UPR	Ø40-111.6	S50C	4	-	f	\N	\N	\N	\N	\N	\N	\N	24	2026-09-28 06:10:32	2026-09-28 06:10:32
8ee09056-ecda-49da-9447-5d2e1253466e	01a0e69e-1879-7204-a5cb-09abb3318484	22	END BLOCK LWR	Ø40-60	S50C	4	-	f	\N	\N	\N	\N	\N	\N	\N	25	2026-09-28 06:10:32	2026-09-28 06:10:32
08ed9956-35a3-4998-bfc8-05adada9e241	01a0e69e-1879-7204-a5cb-09abb3318484	23	GUIDE MATERIAL	30X60X88	S50C	2	-	f	\N	\N	\N	\N	\N	\N	\N	26	2026-09-28 06:10:32	2026-09-28 06:10:32
1374b366-898a-40f9-9e32-eee3057d7f58	01a0e69e-1879-7204-a5cb-09abb3318484	24	MOUNTED 1	Ø20-31.6	SKS3	6	54-56	f	\N	\N	\N	\N	\N	\N	\N	27	2026-09-28 06:10:32	2026-09-28 06:10:32
91f6745b-fec3-4069-947e-4987ae14daa5	01a0e69e-1879-7204-a5cb-09abb3318484	25	MOUNTED 2	Ø20-15	SKS3	4	54-56	f	\N	\N	\N	\N	\N	\N	\N	28	2026-09-28 06:10:32	2026-09-28 06:10:32
\.


--
-- Data for Name: job_batches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_batches (id, name, total_jobs, pending_jobs, failed_jobs, failed_job_ids, options, cancelled_at, created_at, finished_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jobs (id, queue, payload, attempts, reserved_at, available_at, created_at) FROM stdin;
\.


--
-- Data for Name: jos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jos (id, project_id, jo_number, product, type, target_date, finish_date, created_at, updated_at) FROM stdin;
bdc4feb0-a0ae-4bcd-9915-78f1be1103a2	c7298e83-2bd9-41ee-8039-152aad119042	126.144	ROTOR	PROGRESSIVE	2026-10-15	\N	2026-09-28 06:05:15	2026-09-28 06:05:15
63372c05-6dae-41b3-a650-941e70f54f2e	f00cd048-4f1b-40bb-8b31-b2fca1aeb468	126.151	PEDAL	TANDEM	2026-10-15	\N	2026-09-29 04:05:04	2026-09-29 04:05:04
b62005c8-a3fd-483f-b68e-6dc3ef2255a8	f00cd048-4f1b-40bb-8b31-b2fca1aeb468	126.153	BRKT 1 DA4-F5887-00	TANDEM	2026-10-15	\N	2026-09-30 07:38:45	2026-09-30 07:38:45
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	0001_01_01_000000_create_users_table	1
2	0001_01_01_000001_create_cache_table	1
3	0001_01_01_000002_create_jobs_table	1
4	2026_09_03_000001_create_projects_table	1
5	2026_09_03_000002_create_jos_table	1
6	2026_09_03_000003_create_categories_table	1
7	2026_09_03_000004_create_items_table	1
8	2026_09_03_000005_create_controls_table	1
9	2026_09_03_000006_create_po_trackings_table	1
10	2026_09_03_000007_create_process_photos_table	1
11	2026_09_03_000008_create_activities_table	1
12	2026_09_03_000009_create_trial_sessions_table	1
13	2026_09_03_000010_create_trial_findings_table	1
14	2026_09_03_000011_create_trial_entries_table	1
15	2026_09_03_000012_create_trial_entry_photos_table	1
16	2026_09_03_014720_create_personal_access_tokens_table	1
17	2026_09_03_020000_add_username_to_users_table	1
18	2026_09_07_000001_add_company_to_projects_table	2
19	2026_09_07_000001_add_published_snapshot_to_trial_sessions_table	3
20	2026_09_10_000001_add_index_to_po_trackings_control_id	4
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (email, token, created_at) FROM stdin;
\.


--
-- Data for Name: personal_access_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) FROM stdin;
1	App\\Models\\User	3	matrix-token	512f16aeafa9e08439789ec36b60062d88d6c72aacce5b78ecbb01d1e0273057	["*"]	\N	\N	2026-09-04 08:12:11	2026-09-04 08:12:11
2	App\\Models\\User	3	matrix-token	89e52ebbfdd6b820b4e8f22f0a033fdaf72180b8ca406cacc47c941a5619e084	["*"]	\N	\N	2026-09-04 08:24:18	2026-09-04 08:24:18
4	App\\Models\\User	3	test-viewer	fc5fa25eee4c89894cd99671d297e4325220b9cb1b35be242326672548120800	["*"]	\N	\N	2026-09-04 08:48:55	2026-09-04 08:48:55
30	App\\Models\\User	2	matrix-token	ed7c145f1723b0557d7a21410a123f7825944aa0bbb1f5ba93a8932c76c1310b	["*"]	\N	\N	2026-09-10 00:38:37	2026-09-10 00:38:37
31	App\\Models\\User	2	matrix-token	f3ba5c0e98f3cf23793bf911fd70bcc092233155384f1a51cbf46eeb63fd19db	["*"]	\N	\N	2026-09-10 00:50:57	2026-09-10 00:50:57
32	App\\Models\\User	2	matrix-token	63c59706f9125fc2d300345fb6090a0e9f517debd87c71f925db61e705100dfa	["*"]	\N	\N	2026-09-10 02:06:05	2026-09-10 02:06:05
33	App\\Models\\User	3	matrix-token	5813e746ccdeadccf4c67949e5124ad5dfc32413e4cd66f2004a41e7f1346e7c	["*"]	\N	\N	2026-09-10 02:06:08	2026-09-10 02:06:08
34	App\\Models\\User	2	matrix-token	df82c30364c9aa60cd9115e8d45d5190473a0db6a8008fe71966328d2700a431	["*"]	\N	\N	2026-09-10 02:06:15	2026-09-10 02:06:15
11	App\\Models\\User	2	matrix-token	013703003680f1587ade435b6a27a5073ede5dd9b1031e5394d81b162b604279	["*"]	\N	\N	2026-09-07 04:23:13	2026-09-07 04:23:13
35	App\\Models\\User	2	matrix-token	d5c76f77cadd40ed40fef5a87aa20826e9af995913dfa0eebcc37223623fb0f3	["*"]	\N	\N	2026-09-10 02:06:18	2026-09-10 02:06:18
12	App\\Models\\User	3	matrix-token	6b7e8ef8b642013186e0a83a717d82b8889de12846e348d0c092c80923aeadcd	["*"]	\N	\N	2026-09-07 04:24:31	2026-09-07 04:24:31
36	App\\Models\\User	2	matrix-token	555020387b27059ea6e163998938a1ebe7c63bae220c80bbb46357033c47f96e	["*"]	\N	\N	2026-09-10 02:06:20	2026-09-10 02:06:20
37	App\\Models\\User	2	matrix-token	a445d70203ff727e20e6c92b581ba0b0022bf1559b44ce112603fbb402a65122	["*"]	\N	\N	2026-09-10 02:06:23	2026-09-10 02:06:23
15	App\\Models\\User	3	matrix-token	e10923e26f6b3751c71938080d01e4bed4799f1953eb78420cef4acbdb6f191e	["*"]	\N	\N	2026-09-07 04:33:28	2026-09-07 04:33:28
16	App\\Models\\User	3	matrix-token	a6a8cecaffe86c0627c1217a5658fafd09366480ab3ae2819639eb3dc2e4796c	["*"]	\N	\N	2026-09-07 05:09:53	2026-09-07 05:09:53
38	App\\Models\\User	2	matrix-token	188f17aafc4d129c1f15c319134a745bf87d2b2db9db3609466917b7d1d11147	["*"]	\N	\N	2026-09-10 02:06:25	2026-09-10 02:06:25
17	App\\Models\\User	3	matrix-token	13bdb374c22d1fdac696cd6a6e528e687d6312b25ad7af57ffde776a5321cbbb	["*"]	\N	\N	2026-09-07 05:51:23	2026-09-07 05:51:23
39	App\\Models\\User	2	matrix-token	d063e56d84b421044d6514c7b9cba97341d0c603f516aa1517c51838d3fca204	["*"]	\N	\N	2026-09-10 02:06:28	2026-09-10 02:06:28
20	App\\Models\\User	3	matrix-token	8bf80d890e55ebaa8a8bc4326bd45e1d0bf2d6a357393cfc244c1e54c1d40ad3	["*"]	\N	\N	2026-09-07 07:44:01	2026-09-07 07:44:01
21	App\\Models\\User	2	matrix-token	d5b139a487768f02865e8814206428041d92b0a0d453c11a593a162636dec495	["*"]	\N	\N	2026-09-07 07:45:19	2026-09-07 07:45:19
40	App\\Models\\User	2	matrix-token	d0ab8a6ea56027c553258e683ca98f5162d471cb3022815df63bb53b872e26ad	["*"]	\N	\N	2026-09-10 02:08:20	2026-09-10 02:08:20
41	App\\Models\\User	2	matrix-token	02c7d7b61eb8d57966ed7a46558f080d9c8a8fe4099ce847502b7e742c4a7e1e	["*"]	\N	\N	2026-09-10 02:14:00	2026-09-10 02:14:00
24	App\\Models\\User	3	matrix-token	2f0ed4c2a4760d3d69e0b802fd7fbbd14607f49f012491b42ae70576214e25c9	["*"]	\N	\N	2026-09-07 08:20:44	2026-09-07 08:20:44
42	App\\Models\\User	3	matrix-token	4c18df17a2d24059c544cda840997b363ecc255af4ee9bb721d977641bc662f8	["*"]	\N	\N	2026-09-10 02:14:03	2026-09-10 02:14:03
25	App\\Models\\User	2	matrix-token	51d5ca3785a4b98b1341888f7f6ee2a2d694d5f8b0470b631a6c6307aae2fa52	["*"]	\N	\N	2026-09-08 00:37:24	2026-09-08 00:37:24
26	App\\Models\\User	3	matrix-token	febdd33218df697e6df1672bbd8dfac832b0c9272b48711eb23c94632a139b7f	["*"]	\N	\N	2026-09-08 06:15:16	2026-09-08 06:15:16
27	App\\Models\\User	2	matrix-token	6bde1487033cb1fc3850e6be5ff11f59c810bfb7c548eac20da84dfa7c7ae213	["*"]	\N	\N	2026-09-08 07:11:20	2026-09-08 07:11:20
28	App\\Models\\User	2	matrix-token	b93d0ae4c35857b00e88abbae17421f019f488414127603a67729116005a8688	["*"]	\N	\N	2026-09-09 08:54:56	2026-09-09 08:54:56
60	App\\Models\\User	2	matrix-token	0055413f7bd2048ecd7732654c0703c2f93666ed414e5e2629a3581d1e3f728c	["*"]	\N	\N	2026-09-10 02:29:48	2026-09-10 02:29:48
43	App\\Models\\User	2	matrix-token	83327a5bacfe463460f633adefe7581b1558322fbd939b0250746953ad2ddc52	["*"]	\N	\N	2026-09-10 02:14:10	2026-09-10 02:14:10
44	App\\Models\\User	2	matrix-token	ae066d9e527826625e8c69dfcc69a91cd4baf88d31122f3757e955dfad7784bb	["*"]	\N	\N	2026-09-10 02:14:13	2026-09-10 02:14:13
45	App\\Models\\User	2	matrix-token	833fbd8f84917a43619b92255b4955531fae9c6f1b51ae3c0d9f964923261cab	["*"]	\N	\N	2026-09-10 02:14:16	2026-09-10 02:14:16
46	App\\Models\\User	2	matrix-token	e12fbecb91d37a72d798568f1852a1927bc44174ae200c20998848a8763a8cb7	["*"]	\N	\N	2026-09-10 02:14:18	2026-09-10 02:14:18
47	App\\Models\\User	2	matrix-token	9a4e9a2eef8caaf34e31658eb80ae55e2b34ff3d2b92b6e091b9b7e0f6f4f1fe	["*"]	\N	\N	2026-09-10 02:14:21	2026-09-10 02:14:21
48	App\\Models\\User	2	matrix-token	9bf5d35cbe81b2cacccf64861a662bbb49dcd275bc946798839e7f4af2d3fab7	["*"]	\N	\N	2026-09-10 02:14:24	2026-09-10 02:14:24
49	App\\Models\\User	5	sec-ctrl-token	fa065b70eb4dab83ceec5f127a6391ee6353e0e218422476a7d0ba91b746aba3	["*"]	\N	\N	2026-09-10 02:16:01	2026-09-10 02:16:01
50	App\\Models\\User	6	sec-view-token	d1c217065c8281d1d5b41036992bc71061cdcb2a54d3d7a55c7c953687f56ec9	["*"]	\N	\N	2026-09-10 02:16:01	2026-09-10 02:16:01
51	App\\Models\\User	5	sec-ctrl-token	4373b01e9563bd475c8196fdcdc1223ea629a961c3b8103d47b4f566b6d9c4df	["*"]	\N	\N	2026-09-10 02:16:49	2026-09-10 02:16:49
52	App\\Models\\User	6	sec-view-token	1c2fc7ed7f961629f620ae7642ea49a29aea93a20a53c01ba84f5f00c130ff59	["*"]	\N	\N	2026-09-10 02:16:49	2026-09-10 02:16:49
53	App\\Models\\User	2	matrix-token	02e29325de51396e5e268da1f2e8d3c37456dcd982937da4d26f1ac4825455ea	["*"]	\N	\N	2026-09-10 02:24:50	2026-09-10 02:24:50
54	App\\Models\\User	2	matrix-token	6e32cdd6b64892e3c58b142414bc5d79d2b6e6209121e2637fdab51cd9448cfd	["*"]	\N	\N	2026-09-10 02:25:00	2026-09-10 02:25:00
55	App\\Models\\User	2	matrix-token	35653ce27d8cc1e28249319c3b51bd25a2e2b1579ad8cdef5f3eebc3498c4bfe	["*"]	\N	\N	2026-09-10 02:25:09	2026-09-10 02:25:09
56	App\\Models\\User	2	matrix-token	ed6c22c75899818b05a6d2f69256e8ddfe1ada825105c260e8ab7449d5a7a713	["*"]	\N	\N	2026-09-10 02:25:18	2026-09-10 02:25:18
57	App\\Models\\User	2	matrix-token	b6711bbaff0ae81ca09f334a4bcf0d11769abccdcce5888ee3da7ba42d97b45f	["*"]	\N	\N	2026-09-10 02:25:24	2026-09-10 02:25:24
58	App\\Models\\User	2	matrix-token	7e6f1f04c83b46c1adf7d53e43de965fbc85ac6021f56a905aa0e86acea84754	["*"]	\N	\N	2026-09-10 02:26:23	2026-09-10 02:26:23
59	App\\Models\\User	2	matrix-token	b7c2d7b603b98066b9ed9ce24109290af74f07c846cdc179916279187f4073a1	["*"]	\N	\N	2026-09-10 02:29:28	2026-09-10 02:29:28
61	App\\Models\\User	2	matrix-token	ca3642ee898b93c9f30dbcd421dfe2b54748c619800e976f61cfd32e10baac84	["*"]	\N	\N	2026-09-10 02:34:13	2026-09-10 02:34:13
62	App\\Models\\User	3	matrix-token	ac2bb115384ed8fec2cb3cd72e7a58f65b38e6bcc3c012c9d76aa54c9c74616e	["*"]	\N	\N	2026-09-10 02:34:18	2026-09-10 02:34:18
63	App\\Models\\User	2	matrix-token	bade4bac8b9adb8ecf5bab281a1984eb4b8cd744980252810b22538f7225d712	["*"]	\N	\N	2026-09-10 02:34:31	2026-09-10 02:34:31
64	App\\Models\\User	2	matrix-token	8a408b48ebba96db6e84f4d27b13615931f149be8498674c3494b310ee514f07	["*"]	\N	\N	2026-09-10 02:34:37	2026-09-10 02:34:37
65	App\\Models\\User	2	matrix-token	3dbb321f2c89b88a121ec74047fd66c90e8256dfa498e9be3007e76508e80bf8	["*"]	\N	\N	2026-09-10 02:34:42	2026-09-10 02:34:42
66	App\\Models\\User	2	matrix-token	c2019c787d2820411bb801c8e7713fe3af6c425def32a120963a6e2e95baaa9d	["*"]	\N	\N	2026-09-10 02:34:47	2026-09-10 02:34:47
67	App\\Models\\User	2	matrix-token	3d600d692a5a4e0d4384689be0f1bf6b4746744c23ed6734b66aaf81ef985f03	["*"]	\N	\N	2026-09-10 02:34:53	2026-09-10 02:34:53
68	App\\Models\\User	2	matrix-token	18c4b1b84f7597cd80111204fcbd27cb9e8f0c97be9a5ad4dcf1b9c96b1b7de9	["*"]	\N	\N	2026-09-10 02:34:59	2026-09-10 02:34:59
69	App\\Models\\User	2	matrix-token	61d7aaa1d4f481cfde8e27816df1fd4dcf54b60ed63ae446dfcc7ff08171faa1	["*"]	\N	\N	2026-09-10 02:41:02	2026-09-10 02:41:02
70	App\\Models\\User	2	matrix-token	749155cb62e53f61a7878028e79df80a7fc5396ac4b5e6396996855f58101faf	["*"]	\N	\N	2026-09-10 04:27:16	2026-09-10 04:27:16
71	App\\Models\\User	2	matrix-token	f901d62c28bc05f7734a013186fa79ded87a0f9521e4e05f7037978a9f6c80b3	["*"]	\N	\N	2026-09-10 04:50:48	2026-09-10 04:50:48
72	App\\Models\\User	2	matrix-token	4b0b3d2c0b3fc4d3e372d355285be3d5b23c059e6b93d8c1a9145ebdc74b0704	["*"]	\N	\N	2026-09-10 05:00:14	2026-09-10 05:00:14
73	App\\Models\\User	3	matrix-token	67543fe3a1a47eaee9b72a733c324feeb4fba2085d97a12f139696eeb6464638	["*"]	\N	\N	2026-09-10 06:28:44	2026-09-10 06:28:44
74	App\\Models\\User	2	matrix-token	334c09f2a55ec4d2ca00d60b8ca91eb215cf9c672b373dd4b03e6fdfecb5dfbb	["*"]	\N	\N	2026-09-10 07:17:08	2026-09-10 07:17:08
75	App\\Models\\User	3	matrix-token	1cc3f897eebc073937cf428fccb0a0b4cf0155d232b1e4f436ff4814c32cb7a3	["*"]	\N	\N	2026-09-10 07:41:40	2026-09-10 07:41:40
77	App\\Models\\User	2	matrix-token	b2e26c2296d72a0b3ebf2c92ad2c730b44a77a2d5fc0ef961feff1b9340a290a	["*"]	\N	\N	2026-09-11 00:38:35	2026-09-11 00:38:35
78	App\\Models\\User	3	matrix-token	022ea3b2bfc7722e16b772dba2839da4fb49c0b3887aad1ae708b88cff20f939	["*"]	\N	\N	2026-09-11 00:39:50	2026-09-11 00:39:50
102	App\\Models\\User	2	matrix-token	ea873a09a182a03638ca3386e3b0f20d82540479a6b2dbf41b821580deccfed1	["*"]	\N	\N	2026-09-28 04:33:41	2026-09-28 04:33:41
79	App\\Models\\User	2	matrix-token	5551be7a15c310e4f2896498b0551782d6efd06f64d561b30817a518f44f028c	["*"]	\N	\N	2026-09-11 01:01:33	2026-09-11 01:01:33
80	App\\Models\\User	2	matrix-token	173dc252965d536eafdee2ad11b3c22f685331d3eb7f698ca9ec2f1b53e1d2e4	["*"]	\N	\N	2026-09-11 09:01:57	2026-09-11 09:01:57
81	App\\Models\\User	2	matrix-token	ae651af3c9a08d5597fa7810a549e042fafcaa25c824c7351fb7b6bcc0e98a6b	["*"]	\N	\N	2026-09-14 01:45:12	2026-09-14 01:45:12
82	App\\Models\\User	2	matrix-token	3bb66a7a2bfb831ae8cd0ebe168162540e242bbcc7cd5e9031514a689a0add15	["*"]	\N	\N	2026-09-14 04:22:59	2026-09-14 04:22:59
83	App\\Models\\User	2	matrix-token	b4af990ef853656ee1cfef713b32bb0952af0e5ef2f4b77655e7cd7133fe5ddb	["*"]	\N	\N	2026-09-15 02:22:55	2026-09-15 02:22:55
85	App\\Models\\User	2	matrix-token	9af309b5f70fa86e2bfe39c589ae89f4a7c8278c17341beb5df31523e2cd0a3a	["*"]	\N	\N	2026-09-17 07:45:33	2026-09-17 07:45:33
86	App\\Models\\User	2	matrix-token	897f7eb198f687b988cde46d1f9000139c3763c7a42d1d15cde125fac664405d	["*"]	\N	\N	2026-09-17 07:45:46	2026-09-17 07:45:46
107	App\\Models\\User	2	matrix-token	6f62a1d7bcef7c821daffae7d8fce7ba327f519b51774978f983b9352b728fdc	["*"]	\N	\N	2026-09-28 08:16:58	2026-09-28 08:16:58
88	App\\Models\\User	2	matrix-token	3588dc96db5c67a39413ad40160936b7b1a1dd5baa9360e3ba222ccdd0d902b0	["*"]	\N	\N	2026-09-17 08:34:42	2026-09-17 08:34:42
89	App\\Models\\User	2	matrix-token	e550ec6515b3fe2f09241aace06b82e62efc2cf8fef8a8fcc13661a8898df532	["*"]	\N	\N	2026-09-17 08:34:56	2026-09-17 08:34:56
90	App\\Models\\User	3	matrix-token	fb45ef27f8b56e5a3081e1bbe2889f4e3521626814ca8a12002b2b6ab0b77a23	["*"]	\N	\N	2026-09-17 08:36:00	2026-09-17 08:36:00
91	App\\Models\\User	2	matrix-token	3a0df309b7fb2095edb4d2feb1a1d602a8efd386310f20306e5e7a792ec08c97	["*"]	\N	\N	2026-09-17 08:38:20	2026-09-17 08:38:20
92	App\\Models\\User	2	matrix-token	caca9fdfc6aa3ba0c9096af78863f70a913a662d741879442e962b8916417bc5	["*"]	\N	\N	2026-09-19 04:39:39	2026-09-19 04:39:39
93	App\\Models\\User	2	matrix-token	12533c99b612644f4b1116363017c5c0dd3f222d7cfef6906d4a786cce141e8f	["*"]	\N	\N	2026-09-21 06:08:14	2026-09-21 06:08:14
94	App\\Models\\User	2	matrix-token	c01372651b35e48ef490e3aa8e273a57b8e615fe410d6cf8bafbe756737257af	["*"]	\N	\N	2026-09-22 02:44:27	2026-09-22 02:44:27
95	App\\Models\\User	3	matrix-token	a642edf1369668b7140d80fc1f73f5263c8e603bea44380781dcd50500b49e9a	["*"]	\N	\N	2026-09-22 02:44:31	2026-09-22 02:44:31
96	App\\Models\\User	2	matrix-token	ceec5ba103744a7dbd62bc43fc8d2a720753762e59ab09c9f24baed99231e18c	["*"]	\N	\N	2026-09-22 02:51:59	2026-09-22 02:51:59
97	App\\Models\\User	2	matrix-token	c159a61339a13d80c2c15b2ed7007f48c3d32e90133883df8b6bb82ed79e4fbe	["*"]	\N	\N	2026-09-23 01:15:33	2026-09-23 01:15:33
98	App\\Models\\User	2	matrix-token	7107196a3bc5a1f2d7a81ccb4809a7621d3ce52440f47117f65468a8187e458f	["*"]	\N	\N	2026-09-24 01:16:07	2026-09-24 01:16:07
99	App\\Models\\User	2	matrix-token	9d372fadc2758d3ba33bd24013fedbdda8fc9b65e2479f8c28dddee481fe3daf	["*"]	\N	\N	2026-09-24 01:16:10	2026-09-24 01:16:10
100	App\\Models\\User	3	matrix-token	b8dc43ef15152ea0f11e80d42d5d4d356f35b55027f925d93827c12d82b7331e	["*"]	\N	\N	2026-09-24 07:43:12	2026-09-24 07:43:12
101	App\\Models\\User	2	matrix-token	223622835e3a6fbbed01d313bffbb07a5d3112c1d18c7aad014dcfa7082ee8cf	["*"]	\N	\N	2026-09-28 04:07:55	2026-09-28 04:07:55
104	App\\Models\\User	2	matrix-token	6bbcf91bf4f91b952b32b239c0003e240c338c9c5752fa280c2e3f78152febfd	["*"]	\N	\N	2026-09-28 04:56:35	2026-09-28 04:56:35
105	App\\Models\\User	2	matrix-token	b288fbc1e586b7c7d95122ac3a69183d3814811419ffcc34126f580991ab81f7	["*"]	\N	\N	2026-09-28 06:23:18	2026-09-28 06:23:18
106	App\\Models\\User	2	matrix-token	75bf104654adbefd328b4c9eded6abcafc0de5581be7bcd0d7b935e8f10999dd	["*"]	\N	\N	2026-09-28 06:56:52	2026-09-28 06:56:52
108	App\\Models\\User	2	matrix-token	e072edce90cf801d6bc4e63a8a38d27266aec71cb0a46e440b77961057c3c9e1	["*"]	\N	\N	2026-09-29 01:03:03	2026-09-29 01:03:03
109	App\\Models\\User	2	matrix-token	a4bd2b92e83fbb2573d0661b2623c8f79ab607c98af133ea8d585fbc41977d97	["*"]	\N	\N	2026-09-29 01:47:22	2026-09-29 01:47:22
110	App\\Models\\User	3	matrix-token	dd80a810315808677423c7bc85a5d8d0dfc3963356a4dfacc999a94ef365fae3	["*"]	\N	\N	2026-09-29 02:49:44	2026-09-29 02:49:44
111	App\\Models\\User	2	matrix-token	323c5101e57cb22014f7feb2a869084f0a34b72c99dcc378437bcbaa26d0aa0f	["*"]	\N	\N	2026-09-29 02:52:51	2026-09-29 02:52:51
112	App\\Models\\User	2	matrix-token	f87d3e55c26763b4f852ce40e1cb16193263572bc608801dbf6e460d12083722	["*"]	\N	\N	2026-09-29 02:53:43	2026-09-29 02:53:43
114	App\\Models\\User	2	matrix-token	becb581941753f7e8fcec9dffe98177e0e542d9603bc61f5672941dbff8b8668	["*"]	\N	\N	2026-09-29 02:55:01	2026-09-29 02:55:01
115	App\\Models\\User	2	matrix-token	a8af07af322099efa107010bdaa3ab19c8e62ea7c10581435a6a98dfb8bb03a7	["*"]	\N	\N	2026-09-29 03:05:01	2026-09-29 03:05:01
116	App\\Models\\User	3	matrix-token	31e5b0c43bffc8d34a5987f2bfaab7fb3ad4b6006270f54bee5144ed697d3421	["*"]	\N	\N	2026-09-29 03:19:05	2026-09-29 03:19:05
117	App\\Models\\User	2	matrix-token	996b0990c6e297a20f15fd8bb6432b5142f8a6fbf14116a003b75ef33029a255	["*"]	\N	\N	2026-09-29 05:02:20	2026-09-29 05:02:20
118	App\\Models\\User	1	test	2d5c743e126c568bda8ebcea7fdd655e9342f4720ac6d6476ed1f7a123daaefb	["*"]	\N	\N	2026-09-29 06:21:40	2026-09-29 06:21:40
119	App\\Models\\User	1	test	e13fdb83ed5d39d77bbe5d7d5cdde83f6fee5fceb56984185954ac1d45e57b81	["*"]	\N	\N	2026-09-29 06:21:52	2026-09-29 06:21:52
125	App\\Models\\User	2	matrix-token	b6e27982ab57ff658008b9cc10b0ab0fb17294773d02d83ac72c9930fb2366fe	["*"]	2026-10-01 01:20:22	\N	2026-10-01 01:20:13	2026-10-01 01:20:22
126	App\\Models\\User	2	matrix-token	3bba2f94f4711ac851f837a3b5d6b8e4bdbab347cd4c66a5774939a2446a92ef	["*"]	2026-10-01 01:20:51	\N	2026-10-01 01:20:50	2026-10-01 01:20:51
124	App\\Models\\User	2	matrix-token	7b1f171b9491c499d8c7ed2b3706a31c2a2e21d30908a984ef195bef41c862d4	["*"]	2026-10-01 03:38:45	\N	2026-10-01 01:11:08	2026-10-01 03:38:45
127	App\\Models\\User	2	matrix-token	213c61a7800b887f91e43760a1a26429519e1cdeb64c0aa9fa9de3bb2dd9c987	["*"]	2026-10-01 03:48:47	\N	2026-10-01 02:00:49	2026-10-01 03:48:47
123	App\\Models\\User	2	matrix-token	21250c74315ebb686c96adeec8e2b225c254a8f0176ee048ea5067ecdd538b5a	["*"]	2026-09-30 04:53:12	\N	2026-09-30 04:27:07	2026-09-30 04:53:12
120	App\\Models\\User	2	matrix-token	20c270e395564c380428672d9428d9ddf4dd3a21a5167be1f4fc97f9d051b3c8	["*"]	2026-09-30 08:21:50	\N	2026-09-30 02:15:56	2026-09-30 08:21:50
121	App\\Models\\User	2	matrix-token	047a2dbe6dfd8da63e20432b9dcf69ab8b70d6b9aaada884a130aa857068f777	["*"]	2026-09-30 08:25:11	\N	2026-09-30 02:26:14	2026-09-30 08:25:11
122	App\\Models\\User	2	matrix-token	09d0958555b82826e34265a4f521bebd20d5d9dbed4d0c8b1c4c61feee0c99eb	["*"]	2026-09-30 08:38:11	\N	2026-09-30 02:52:31	2026-09-30 08:38:11
\.


--
-- Data for Name: po_trackings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.po_trackings (id, control_id, supplier, po_no, po_date, target_arrival, notes, created_at, updated_at) FROM stdin;
01a0f133-d526-7283-a3c9-47e0f11bcf62	01a0f12f-bfeb-70bc-94f0-aad1e51c379e	PT Precision Special Steel	1286	2026-09-30	2026-10-01	\N	2026-09-30 07:25:01	2026-09-30 07:25:01
01a0f13b-6ca1-70ca-9785-0aff30001dfb	01a0e6a4-f20f-712a-8e28-753a57a12206	\N	\N	2026-09-30	\N	\N	2026-09-30 07:33:18	2026-09-30 07:33:18
01a0e708-9eb4-700f-8145-b326541fb95d	01a0e6a5-d83e-7325-af1a-fef781f6a2bf	PT Astra Daido	126.144	2026-09-24	2026-09-25	\N	2026-09-28 08:01:36	2026-09-28 08:01:36
01a0e708-9ec2-731e-b04c-f61c850d493a	01a0e6a5-d827-7061-bec6-f08ffc675252	PT Astra Daido	126.144	2026-09-24	2026-09-25	\N	2026-09-28 08:01:36	2026-09-28 08:01:36
\.


--
-- Data for Name: process_photos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.process_photos (id, control_id, name, path, added_at, created_at, updated_at) FROM stdin;
01a0e6b3-d198-728a-8156-df16610dede3	01a0e6a2-ecf7-71f1-b9ba-1e44906a82e2	17905769295222159002872043959300.jpg	process-photos/2026/09/3dcd8209-705c-417b-9bf3-64b1ea57d8c7.jpg	2026-09-28 06:28:59	2026-09-28 06:28:59	2026-09-28 06:28:59
01a0e6b7-b167-7089-9af4-9ab6bc448f2d	01a0e6a2-ec81-7295-9d8b-2bf70091f505	17905771833373321036547809249446.jpg	process-photos/2026/09/daf58a1a-d80a-4c1c-9bfb-047a22e4121d.jpg	2026-09-28 06:33:13	2026-09-28 06:33:13	2026-09-28 06:33:13
01a0e6b8-682e-7272-943d-c77666b1f59a	01a0e6a2-ec94-7052-b4c7-cccfedddf68e	17905772298828941682986181895883.jpg	process-photos/2026/09/e3cc0920-b1ed-4a2d-afeb-71eb897e5a47.jpg	2026-09-28 06:34:00	2026-09-28 06:34:00	2026-09-28 06:34:00
01a0e6b8-f4d0-70e6-ad2e-a0158f1b6b28	01a0e6a2-eca8-73a8-a7bf-3da7bba7bd4a	17905772666307565902997998425639.jpg	process-photos/2026/09/e84b8534-3161-44b5-89b4-7ffb4eedec91.jpg	2026-09-28 06:34:36	2026-09-28 06:34:36	2026-09-28 06:34:36
01a0e6b9-c0b4-70f5-9757-e44e6e5376aa	01a0e6a2-ec9e-7344-b483-f89c49b1e76f	17905773184651059819898751582691.jpg	process-photos/2026/09/8bbcee9e-eec3-4774-b082-f5c5f4b8a40a.jpg	2026-09-28 06:35:28	2026-09-28 06:35:28	2026-09-28 06:35:28
01a0e6ba-be64-701a-bd4c-65d542409921	01a0e6a2-ec6e-7142-8bdd-5b0e0d1523d7	17905773830232667360556630254407.jpg	process-photos/2026/09/be18c8f7-eace-4da3-a527-35e67ee585bf.jpg	2026-09-28 06:36:33	2026-09-28 06:36:33	2026-09-28 06:36:33
01a0e6bb-b6eb-70c4-85b8-d188a406ad3e	01a0e6a2-ec77-7180-8754-c365efaa64b7	1790577445725456687530415900362.jpg	process-photos/2026/09/d3c77ab2-e1bc-46bf-bb4c-caf4549bb351.jpg	2026-09-28 06:37:36	2026-09-28 06:37:36	2026-09-28 06:37:36
01a0e6bc-f3d1-7131-b1db-1c07d22521db	01a0e6a2-ec8b-73ce-a4c2-99bd79bca459	17905775290518768634091925300902.jpg	process-photos/2026/09/30d329cc-527b-48e9-b863-a036987678ee.jpg	2026-09-28 06:38:58	2026-09-28 06:38:58	2026-09-28 06:38:58
01a0e6bf-43bc-7113-a2c5-56069d8362fc	01a0e6a2-ecbb-70f0-be71-479b083137e2	17905776758975013185994594710835.jpg	process-photos/2026/09/562a41a6-81f4-44c9-84e8-7a78c4d9991b.jpg	2026-09-28 06:41:29	2026-09-28 06:41:29	2026-09-28 06:41:29
01a0e6bf-bf79-718e-9c14-0d0c2606dae4	01a0e6a2-ecc6-70bd-8a94-599ff2acfedc	17905777118145296758737340382205.jpg	process-photos/2026/09/d1f11d9e-ea60-4e31-811c-b3c45dd5a367.jpg	2026-09-28 06:42:01	2026-09-28 06:42:01	2026-09-28 06:42:01
01a0e6c0-a895-70bb-b00e-5c00b6359723	01a0e6a2-ecb2-727e-b402-36c041df098b	17905777705881456624098426071524.jpg	process-photos/2026/09/06369359-fb50-4ed0-862e-27d3d29edce8.jpg	2026-09-28 06:43:00	2026-09-28 06:43:00	2026-09-28 06:43:00
01a0e6c3-c8ea-717c-a2ef-38aa27d1178f	01a0e6a2-ecd2-70ae-aa14-14fce38e8a9f	17905779779576975811572720792992.jpg	process-photos/2026/09/084c653d-7fd9-4029-adba-871cfd93ff4c.jpg	2026-09-28 06:46:25	2026-09-28 06:46:25	2026-09-28 06:46:25
01a0f091-f3b7-72e4-9dd1-1a6b55558a20	01a0e6a5-d833-70a6-85f8-ef669d16dd96	17907424527823597773834441782149.jpg	process-photos/2026/09/9596b550-9a98-43a2-9433-dd47d4fdfcd1.jpg	2026-09-30 04:28:12	2026-09-30 04:28:12	2026-09-30 04:28:12
01a0f09c-7ed8-7316-91af-37b45d989ca6	01a0e6a2-ece9-71a2-882a-527b64b7ecb8	17907431342567866673381594983709.jpg	process-photos/2026/09/2b340bcb-93dc-441f-b1f8-59776856d5e0.jpg	2026-09-30 04:39:43	2026-09-30 04:39:43	2026-09-30 04:39:43
01a0f09e-7afb-71ce-be43-b4f25430a820	01a0e6a2-ec63-71b0-b6cb-f2f37bad8984	17907432849965650078385771389907.jpg	process-photos/2026/09/83f55e78-c1af-45a1-b85d-e6b78a6d8705.jpg	2026-09-30 04:41:53	2026-09-30 04:41:53	2026-09-30 04:41:53
01a0f0ab-0b2e-719d-ab0f-f9a314b37658	01a0e6a2-ece2-731b-89a4-79506c421736	makura.jpg	process-photos/2026/09/fc68f595-d215-4a7c-b5b0-054107aaf5a6.jpg	2026-09-30 04:55:36	2026-09-30 04:55:36	2026-09-30 04:55:36
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, name, customer, created_at, updated_at, company) FROM stdin;
c7298e83-2bd9-41ee-8039-152aad119042	Kawasaki 431X	PT YUTAKA MANUFACTURING INDONESIA	2026-09-14 06:06:41	2026-09-14 06:06:41	BMI
f00cd048-4f1b-40bb-8b31-b2fca1aeb468	DA4	PT METINDO ERA SAKTI	2026-09-29 04:04:19	2026-09-29 04:04:19	BKP
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, user_id, ip_address, user_agent, payload, last_activity) FROM stdin;
Zb6BVI6oXodlArvCqceAWFoBlYkxXlzt7rTWhaJi	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36	eyJfdG9rZW4iOiJoNW9yb0VlcThYSEVndDVhaElhR1JpV0o1ZTRZQXR4Y0FLMmpTMVNPIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19	1790215343
\.


--
-- Data for Name: trial_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trial_entries (id, trial_finding_id, section, "order", text, target_date, pic, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: trial_entry_photos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trial_entry_photos (id, trial_entry_id, name, path, added_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: trial_findings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trial_findings (id, trial_session_id, "order", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: trial_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trial_sessions (id, jo_id, name, trial_date, update_date, customer, job_no, pic_name, approved_by_name, created_at, updated_at, published_snapshot, last_published_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, email_verified_at, password, role, remember_token, created_at, updated_at, username) FROM stdin;
1	Test User	test@example.com	2026-09-04 02:06:50	$2y$12$VJqe/GM89kkCOrlFl3lG7O9W0MrxQ1VMHDPS52z1ZHiPPYVv43bOm	controller	9nvP7GuvUz	2026-09-04 02:06:50	2026-09-04 02:06:50	\N
2	Staff Engineering	engineering@matrix.com	\N	$2y$12$zJkOg5ivTIpnrMJrFPbezO3Jg/k5G9Ci94n85LbwUFy.hZGoN01ZK	controller	\N	2026-09-04 02:06:51	2026-09-04 02:06:51	matrix
3	Viewer	viewer@matrix.com	\N	$2y$12$z4huvqkgZO1.WUS2lR1BQekfWatqtiH57VhQOZByQa.HZ2CqyJzzi	viewer	\N	2026-09-04 02:06:51	2026-09-04 02:06:51	matrix#1
4	Admin Controller	controller@matrix.com	\N	$2y$12$aQOChW/9bnU/QN2AlBseHueEHtaEuxUYNiQS27eYTgIF87LKCP.VG	controller	\N	2026-09-04 02:06:51	2026-09-04 02:06:51	controller
5	Sec Controller	sec_controller@test.com	\N	$2y$12$yNYD6063cx0iK/eQZ.58IO/wX15T8bKPvhMb0ceO8OTC7u7QUeeYe	controller	\N	2026-09-10 02:16:01	2026-09-10 02:16:01	\N
6	Sec Viewer	sec_viewer@test.com	\N	$2y$12$.35Jq396thAmDUtNFmshEebqJlA6By5kuiSj/yGK9cioyQ9QBSXH6	viewer	\N	2026-09-10 02:16:01	2026-09-10 02:16:01	\N
\.


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.failed_jobs_id_seq', 1, false);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, false);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 20, true);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.personal_access_tokens_id_seq', 127, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: controls controls_item_id_process_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controls
    ADD CONSTRAINT controls_item_id_process_unique UNIQUE (item_id, process);


--
-- Name: controls controls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controls
    ADD CONSTRAINT controls_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: jos jos_jo_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jos
    ADD CONSTRAINT jos_jo_number_unique UNIQUE (jo_number);


--
-- Name: jos jos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jos
    ADD CONSTRAINT jos_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- Name: po_trackings po_trackings_control_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.po_trackings
    ADD CONSTRAINT po_trackings_control_id_unique UNIQUE (control_id);


--
-- Name: po_trackings po_trackings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.po_trackings
    ADD CONSTRAINT po_trackings_pkey PRIMARY KEY (id);


--
-- Name: process_photos process_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.process_photos
    ADD CONSTRAINT process_photos_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: trial_entries trial_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_entries
    ADD CONSTRAINT trial_entries_pkey PRIMARY KEY (id);


--
-- Name: trial_entry_photos trial_entry_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_entry_photos
    ADD CONSTRAINT trial_entry_photos_pkey PRIMARY KEY (id);


--
-- Name: trial_findings trial_findings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_findings
    ADD CONSTRAINT trial_findings_pkey PRIMARY KEY (id);


--
-- Name: trial_sessions trial_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_sessions
    ADD CONSTRAINT trial_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: activities_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_created_at_index ON public.activities USING btree (created_at);


--
-- Name: activities_jo_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_jo_id_index ON public.activities USING btree (jo_id);


--
-- Name: cache_expiration_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cache_expiration_index ON public.cache USING btree (expiration);


--
-- Name: cache_locks_expiration_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cache_locks_expiration_index ON public.cache_locks USING btree (expiration);


--
-- Name: categories_jo_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX categories_jo_id_index ON public.categories USING btree (jo_id);


--
-- Name: categories_kind_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX categories_kind_index ON public.categories USING btree (kind);


--
-- Name: categories_sort_order_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX categories_sort_order_index ON public.categories USING btree (sort_order);


--
-- Name: controls_item_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX controls_item_id_index ON public.controls USING btree (item_id);


--
-- Name: controls_process_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX controls_process_index ON public.controls USING btree (process);


--
-- Name: controls_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX controls_status_index ON public.controls USING btree (status);


--
-- Name: controls_target_date_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX controls_target_date_index ON public.controls USING btree (target_date);


--
-- Name: failed_jobs_connection_queue_failed_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX failed_jobs_connection_queue_failed_at_index ON public.failed_jobs USING btree (connection, queue, failed_at);


--
-- Name: items_arrival_target_date_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_arrival_target_date_index ON public.items USING btree (arrival_target_date);


--
-- Name: items_category_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_category_id_index ON public.items USING btree (category_id);


--
-- Name: items_description_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_description_index ON public.items USING btree (description);


--
-- Name: items_is_subcont_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_is_subcont_index ON public.items USING btree (is_subcont);


--
-- Name: items_no_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_no_index ON public.items USING btree (no);


--
-- Name: items_subcont_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_subcont_status_index ON public.items USING btree (subcont_status);


--
-- Name: items_subcont_supplier_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX items_subcont_supplier_index ON public.items USING btree (subcont_supplier);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: jos_finish_date_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jos_finish_date_index ON public.jos USING btree (finish_date);


--
-- Name: jos_product_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jos_product_index ON public.jos USING btree (product);


--
-- Name: jos_project_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jos_project_id_index ON public.jos USING btree (project_id);


--
-- Name: jos_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jos_type_index ON public.jos USING btree (type);


--
-- Name: personal_access_tokens_expires_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_access_tokens_expires_at_index ON public.personal_access_tokens USING btree (expires_at);


--
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- Name: po_trackings_po_no_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX po_trackings_po_no_index ON public.po_trackings USING btree (po_no);


--
-- Name: po_trackings_supplier_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX po_trackings_supplier_index ON public.po_trackings USING btree (supplier);


--
-- Name: po_trackings_target_arrival_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX po_trackings_target_arrival_index ON public.po_trackings USING btree (target_arrival);


--
-- Name: process_photos_control_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX process_photos_control_id_index ON public.process_photos USING btree (control_id);


--
-- Name: projects_company_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX projects_company_index ON public.projects USING btree (company);


--
-- Name: projects_customer_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX projects_customer_index ON public.projects USING btree (customer);


--
-- Name: projects_name_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX projects_name_index ON public.projects USING btree (name);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: trial_entries_order_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trial_entries_order_index ON public.trial_entries USING btree ("order");


--
-- Name: trial_entries_section_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trial_entries_section_index ON public.trial_entries USING btree (section);


--
-- Name: trial_entries_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trial_entries_status_index ON public.trial_entries USING btree (status);


--
-- Name: trial_entries_trial_finding_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trial_entries_trial_finding_id_index ON public.trial_entries USING btree (trial_finding_id);


--
-- Name: trial_entry_photos_trial_entry_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trial_entry_photos_trial_entry_id_index ON public.trial_entry_photos USING btree (trial_entry_id);


--
-- Name: trial_findings_order_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trial_findings_order_index ON public.trial_findings USING btree ("order");


--
-- Name: trial_findings_trial_session_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trial_findings_trial_session_id_index ON public.trial_findings USING btree (trial_session_id);


--
-- Name: trial_sessions_jo_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trial_sessions_jo_id_index ON public.trial_sessions USING btree (jo_id);


--
-- Name: trial_sessions_job_no_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trial_sessions_job_no_index ON public.trial_sessions USING btree (job_no);


--
-- Name: trial_sessions_trial_date_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trial_sessions_trial_date_index ON public.trial_sessions USING btree (trial_date);


--
-- Name: users_role_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_role_index ON public.users USING btree (role);


--
-- Name: users_username_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_username_index ON public.users USING btree (username);


--
-- Name: activities activities_jo_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_jo_id_foreign FOREIGN KEY (jo_id) REFERENCES public.jos(id) ON DELETE CASCADE;


--
-- Name: categories categories_jo_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_jo_id_foreign FOREIGN KEY (jo_id) REFERENCES public.jos(id) ON DELETE CASCADE;


--
-- Name: controls controls_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.controls
    ADD CONSTRAINT controls_item_id_foreign FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: items items_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_category_id_foreign FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: jos jos_project_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jos
    ADD CONSTRAINT jos_project_id_foreign FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: po_trackings po_trackings_control_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.po_trackings
    ADD CONSTRAINT po_trackings_control_id_foreign FOREIGN KEY (control_id) REFERENCES public.controls(id) ON DELETE CASCADE;


--
-- Name: process_photos process_photos_control_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.process_photos
    ADD CONSTRAINT process_photos_control_id_foreign FOREIGN KEY (control_id) REFERENCES public.controls(id) ON DELETE CASCADE;


--
-- Name: trial_entries trial_entries_trial_finding_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_entries
    ADD CONSTRAINT trial_entries_trial_finding_id_foreign FOREIGN KEY (trial_finding_id) REFERENCES public.trial_findings(id) ON DELETE CASCADE;


--
-- Name: trial_entry_photos trial_entry_photos_trial_entry_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_entry_photos
    ADD CONSTRAINT trial_entry_photos_trial_entry_id_foreign FOREIGN KEY (trial_entry_id) REFERENCES public.trial_entries(id) ON DELETE CASCADE;


--
-- Name: trial_findings trial_findings_trial_session_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_findings
    ADD CONSTRAINT trial_findings_trial_session_id_foreign FOREIGN KEY (trial_session_id) REFERENCES public.trial_sessions(id) ON DELETE CASCADE;


--
-- Name: trial_sessions trial_sessions_jo_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_sessions
    ADD CONSTRAINT trial_sessions_jo_id_foreign FOREIGN KEY (jo_id) REFERENCES public.jos(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict kmgVKOFBPiP6t71y6zThU3VZ4NHnGVrmhkxMBvmeQGKpv4u9Sts4V1RgarM46S9

