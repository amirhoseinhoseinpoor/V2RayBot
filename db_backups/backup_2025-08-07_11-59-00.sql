--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 17.5

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

--
-- Name: VPNType; Type: TYPE; Schema: public; Owner: V2RayBot
--

CREATE TYPE public."VPNType" AS ENUM (
    'free',
    'paid'
);


ALTER TYPE public."VPNType" OWNER TO "V2RayBot";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: V2RayBot
--

CREATE TABLE public."Payment" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "planId" integer NOT NULL,
    amount double precision NOT NULL,
    receipt text NOT NULL,
    status text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Payment" OWNER TO "V2RayBot";

--
-- Name: Payment_id_seq; Type: SEQUENCE; Schema: public; Owner: V2RayBot
--

CREATE SEQUENCE public."Payment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Payment_id_seq" OWNER TO "V2RayBot";

--
-- Name: Payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: V2RayBot
--

ALTER SEQUENCE public."Payment_id_seq" OWNED BY public."Payment".id;


--
-- Name: Plan; Type: TABLE; Schema: public; Owner: V2RayBot
--

CREATE TABLE public."Plan" (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    duration integer NOT NULL,
    "trafficGB" integer NOT NULL,
    price double precision NOT NULL
);


ALTER TABLE public."Plan" OWNER TO "V2RayBot";

--
-- Name: Plan_id_seq; Type: SEQUENCE; Schema: public; Owner: V2RayBot
--

CREATE SEQUENCE public."Plan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Plan_id_seq" OWNER TO "V2RayBot";

--
-- Name: Plan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: V2RayBot
--

ALTER SEQUENCE public."Plan_id_seq" OWNED BY public."Plan".id;


--
-- Name: Traffic; Type: TABLE; Schema: public; Owner: V2RayBot
--

CREATE TABLE public."Traffic" (
    id integer NOT NULL,
    "vpnId" integer NOT NULL,
    uplink bigint DEFAULT 0 NOT NULL,
    downlink bigint DEFAULT 0 NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Traffic" OWNER TO "V2RayBot";

--
-- Name: Traffic_id_seq; Type: SEQUENCE; Schema: public; Owner: V2RayBot
--

CREATE SEQUENCE public."Traffic_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Traffic_id_seq" OWNER TO "V2RayBot";

--
-- Name: Traffic_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: V2RayBot
--

ALTER SEQUENCE public."Traffic_id_seq" OWNED BY public."Traffic".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: V2RayBot
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    "telegramId" bigint NOT NULL,
    username text,
    "firstName" text,
    "freeAccount" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."User" OWNER TO "V2RayBot";

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: V2RayBot
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO "V2RayBot";

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: V2RayBot
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: VPN; Type: TABLE; Schema: public; Owner: V2RayBot
--

CREATE TABLE public."VPN" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    email text NOT NULL,
    uuid text NOT NULL,
    "alterId" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    type public."VPNType" NOT NULL,
    expired boolean DEFAULT false NOT NULL,
    "trafficLimit" bigint DEFAULT 0 NOT NULL,
    "planId" integer
);


ALTER TABLE public."VPN" OWNER TO "V2RayBot";

--
-- Name: VPN_id_seq; Type: SEQUENCE; Schema: public; Owner: V2RayBot
--

CREATE SEQUENCE public."VPN_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."VPN_id_seq" OWNER TO "V2RayBot";

--
-- Name: VPN_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: V2RayBot
--

ALTER SEQUENCE public."VPN_id_seq" OWNED BY public."VPN".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: V2RayBot
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO "V2RayBot";

--
-- Name: Payment id; Type: DEFAULT; Schema: public; Owner: V2RayBot
--

ALTER TABLE ONLY public."Payment" ALTER COLUMN id SET DEFAULT nextval('public."Payment_id_seq"'::regclass);


--
-- Name: Plan id; Type: DEFAULT; Schema: public; Owner: V2RayBot
--

ALTER TABLE ONLY public."Plan" ALTER COLUMN id SET DEFAULT nextval('public."Plan_id_seq"'::regclass);


--
-- Name: Traffic id; Type: DEFAULT; Schema: public; Owner: V2RayBot
--

ALTER TABLE ONLY public."Traffic" ALTER COLUMN id SET DEFAULT nextval('public."Traffic_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: V2RayBot
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Name: VPN id; Type: DEFAULT; Schema: public; Owner: V2RayBot
--

ALTER TABLE ONLY public."VPN" ALTER COLUMN id SET DEFAULT nextval('public."VPN_id_seq"'::regclass);


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: V2RayBot
--

COPY public."Payment" (id, "userId", "planId", amount, receipt, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Plan; Type: TABLE DATA; Schema: public; Owner: V2RayBot
--

COPY public."Plan" (id, name, description, duration, "trafficGB", price) FROM stdin;
1	یک ماهه 25 گیگ	25GB اینترینت برای 30 روز	30	25	80
2	یک ماهه 50 گیگ	50GB اینترینت برای 30 روز	30	50	150
3	یک ماهه 75 گیگ	75GB اینترینت برای 30 روز	30	75	210
\.


--
-- Data for Name: Traffic; Type: TABLE DATA; Schema: public; Owner: V2RayBot
--

COPY public."Traffic" (id, "vpnId", uplink, downlink, "timestamp") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: V2RayBot
--

COPY public."User" (id, "telegramId", username, "firstName", "freeAccount", "createdAt") FROM stdin;
36	5761201397	MerajIsHere	Meraj Mousavi	f	2025-08-04 22:28:15.232
35	7974373171	VIPV2RayNG_config_S	V2RAY	t	2025-08-03 16:50:51.087
\.


--
-- Data for Name: VPN; Type: TABLE DATA; Schema: public; Owner: V2RayBot
--

COPY public."VPN" (id, "userId", email, uuid, "alterId", "createdAt", type, expired, "trafficLimit", "planId") FROM stdin;
39	35	free-7974373171-VIPV2RayNG_conf-9bfc7b@vpn.test	9bfc7b82-9582-4ebe-ae08-a848f9778f59	0	2025-08-07 01:24:03.343	free	f	0	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: V2RayBot
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
1ede73da-097b-4ba5-a403-84a1f355b62e	909359d20d6825fab328643f03a6a6757eb75b18fd78a32840baf94b324336de	2025-08-03 15:46:58.020002+00	20250726153400_add_user_model	\N	\N	2025-08-03 15:46:58.000269+00	1
710e9ed3-5284-4cb5-b56a-b50651fc7f4b	0648721df1ca1ebc2817b90c04d619cb75998406a89140a4633fe91dac7d4689	2025-08-03 15:46:58.046352+00	20250728193329_init	\N	\N	2025-08-03 15:46:58.021915+00	1
a3fb5af3-26bd-4683-9c36-441db24cee77	68ba8527533f2a68c74528f1f34c196125c75459d3c7c62538a0696c5ca5bf5b	2025-08-03 15:46:58.072662+00	20250729213755_init	\N	\N	2025-08-03 15:46:58.04949+00	1
\.


--
-- Name: Payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: V2RayBot
--

SELECT pg_catalog.setval('public."Payment_id_seq"', 1, false);


--
-- Name: Plan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: V2RayBot
--

SELECT pg_catalog.setval('public."Plan_id_seq"', 1, false);


--
-- Name: Traffic_id_seq; Type: SEQUENCE SET; Schema: public; Owner: V2RayBot
--

SELECT pg_catalog.setval('public."Traffic_id_seq"', 16, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: V2RayBot
--

SELECT pg_catalog.setval('public."User_id_seq"', 36, true);


--
-- Name: VPN_id_seq; Type: SEQUENCE SET; Schema: public; Owner: V2RayBot
--

SELECT pg_catalog.setval('public."VPN_id_seq"', 71, true);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: V2RayBot
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: Plan Plan_pkey; Type: CONSTRAINT; Schema: public; Owner: V2RayBot
--

ALTER TABLE ONLY public."Plan"
    ADD CONSTRAINT "Plan_pkey" PRIMARY KEY (id);


--
-- Name: Traffic Traffic_pkey; Type: CONSTRAINT; Schema: public; Owner: V2RayBot
--

ALTER TABLE ONLY public."Traffic"
    ADD CONSTRAINT "Traffic_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: V2RayBot
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VPN VPN_pkey; Type: CONSTRAINT; Schema: public; Owner: V2RayBot
--

ALTER TABLE ONLY public."VPN"
    ADD CONSTRAINT "VPN_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: V2RayBot
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: User_telegramId_key; Type: INDEX; Schema: public; Owner: V2RayBot
--

CREATE UNIQUE INDEX "User_telegramId_key" ON public."User" USING btree ("telegramId");


--
-- Name: VPN_email_key; Type: INDEX; Schema: public; Owner: V2RayBot
--

CREATE UNIQUE INDEX "VPN_email_key" ON public."VPN" USING btree (email);


--
-- Name: Payment Payment_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: V2RayBot
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."Plan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: V2RayBot
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Traffic Traffic_vpnId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: V2RayBot
--

ALTER TABLE ONLY public."Traffic"
    ADD CONSTRAINT "Traffic_vpnId_fkey" FOREIGN KEY ("vpnId") REFERENCES public."VPN"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: VPN VPN_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: V2RayBot
--

ALTER TABLE ONLY public."VPN"
    ADD CONSTRAINT "VPN_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."Plan"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VPN VPN_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: V2RayBot
--

ALTER TABLE ONLY public."VPN"
    ADD CONSTRAINT "VPN_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

