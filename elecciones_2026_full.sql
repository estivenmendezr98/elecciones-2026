--
-- PostgreSQL database dump
--

\restrict aCAIOgUOKnuPn0Jgs0tbL19WR0MmFq9sCvyB2USZXJ8Pb9rlAzRVPLIjg97Etue

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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
-- Name: update_voter_status_on_delete(); Type: FUNCTION; Schema: public; Owner: root
--

CREATE FUNCTION public.update_voter_status_on_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE directivos_docentes
    SET estado = 'ACTIVO'
    WHERE id = OLD.id_directivo;
    RETURN OLD;
END;
$$;


ALTER FUNCTION public.update_voter_status_on_delete() OWNER TO root;

--
-- Name: update_voter_status_on_insert(); Type: FUNCTION; Schema: public; Owner: root
--

CREATE FUNCTION public.update_voter_status_on_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE directivos_docentes
    SET estado = 'VOTO_REGISTRADO'
    WHERE id = NEW.id_directivo;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_voter_status_on_insert() OWNER TO root;

--
-- Name: sq_administradores; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.sq_administradores
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sq_administradores OWNER TO root;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: administradores; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.administradores (
    id integer DEFAULT nextval('public.sq_administradores'::regclass) NOT NULL,
    usuario character varying(50) NOT NULL,
    nombre character varying(100) NOT NULL,
    "contraseña" character varying(255) NOT NULL,
    estado character varying(50) DEFAULT 'ACTIVO'::character varying,
    rol character varying(20) DEFAULT 'ADMIN'::character varying
);


ALTER TABLE public.administradores OWNER TO root;

--
-- Name: sq_candidatos; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.sq_candidatos
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sq_candidatos OWNER TO root;

--
-- Name: candidatos; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.candidatos (
    id integer DEFAULT nextval('public.sq_candidatos'::regclass) NOT NULL,
    nombre character varying(200) NOT NULL,
    institucion character varying(255) NOT NULL,
    municipio_id integer,
    descripcion text,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    foto character varying(255)
);


ALTER TABLE public.candidatos OWNER TO root;

--
-- Name: sq_directivos_docentes; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.sq_directivos_docentes
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sq_directivos_docentes OWNER TO root;

--
-- Name: directivos_docentes; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.directivos_docentes (
    id integer DEFAULT nextval('public.sq_directivos_docentes'::regclass) NOT NULL,
    cedula character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    municipio_id integer,
    institucion character varying(255) NOT NULL,
    "contraseña" character varying(255) NOT NULL,
    estado character varying(50) DEFAULT 'ACTIVO'::character varying,
    rol character varying(20) DEFAULT 'VOTANTE'::character varying
);


ALTER TABLE public.directivos_docentes OWNER TO root;

--
-- Name: sq_eleccion; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.sq_eleccion
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sq_eleccion OWNER TO root;

--
-- Name: eleccion; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.eleccion (
    id integer DEFAULT nextval('public.sq_eleccion'::regclass) NOT NULL,
    nombre_eleccion character varying(255) NOT NULL,
    fecha date NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    estado character varying(50) DEFAULT 'PROGRAMADA'::character varying
);


ALTER TABLE public.eleccion OWNER TO root;

--
-- Name: sq_municipios; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.sq_municipios
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sq_municipios OWNER TO root;

--
-- Name: municipios; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.municipios (
    id integer DEFAULT nextval('public.sq_municipios'::regclass) NOT NULL,
    nombre character varying(100) NOT NULL,
    departamento character varying(100) DEFAULT 'Cauca'::character varying NOT NULL
);


ALTER TABLE public.municipios OWNER TO root;

--
-- Name: sq_votos; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.sq_votos
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sq_votos OWNER TO root;

--
-- Name: votos; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.votos (
    id integer DEFAULT nextval('public.sq_votos'::regclass) NOT NULL,
    id_directivo integer,
    id_candidato integer,
    fecha_voto timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_votante character varying(45)
);


ALTER TABLE public.votos OWNER TO root;

--
-- Data for Name: administradores; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.administradores (id, usuario, nombre, "contraseña", estado, rol) FROM stdin;
1	admin	Administrador Sistema	$2b$10$6oyGrVLjoHlNuzfKm6k6Q.SaZ1Mg8uVRNKnwBExqRaBV9djTlxLDa	ACTIVO	ADMIN
\.


--
-- Data for Name: candidatos; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.candidatos (id, nombre, institucion, municipio_id, descripcion, fecha_registro, foto) FROM stdin;
5	Pepito Perez	JOSE EUSEBIO CARO	61	Prueba propuesta Pepito Perez	2026-03-12 10:23:20.467294	/uploads/candidates/1773329000386-93891108.jpg
\.


--
-- Data for Name: directivos_docentes; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.directivos_docentes (id, cedula, nombre, apellido, municipio_id, institucion, "contraseña", estado, rol) FROM stdin;
6	101010	FRANSICO	MUÑOZ	47	SAN AGUSTIN	$2b$10$FdE8QNGo1h4n1Svnm7.NT.7xlbmmw4zpaPFXR22T.Y4uyYuA7XIDi	ACTIVO	VOTANTE
7	106177777	ESTIVEN	MENDEZ	56	SEDCAUCA	$2b$10$rdv4W9HbPBXghMTW3b67eOE7TkC8d4lmyCkHKWssoaRJ8QzL0pOu2	ACTIVO	VOTANTE
\.


--
-- Data for Name: eleccion; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.eleccion (id, nombre_eleccion, fecha, hora_inicio, hora_fin, estado) FROM stdin;
1	Elección del directivo docente representante ante el Comité Regional de Prestaciones Sociales	2026-03-30	08:00:00	16:00:00	PROGRAMADA
2	Elección del directivo docente representante ante el Comité Regional de Prestaciones Sociales	2026-03-30	08:00:00	16:00:00	ACTIVA
3	Elección del directivo docente representante ante el Comité Regional de Prestaciones Sociales	2026-03-30	08:00:00	16:00:00	PROGRAMADA
4	Elección del directivo docente representante ante el Comité Regional de Prestaciones Sociales	2026-03-30	08:00:00	16:00:00	ACTIVA
5	Elección del directivo docente representante ante el Comité Regional de Prestaciones Sociales	2026-03-30	08:00:00	16:00:00	ACTIVA
\.


--
-- Data for Name: municipios; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.municipios (id, nombre, departamento) FROM stdin;
43	Almaguer	Cauca
44	Argelia	Cauca
45	Balboa	Cauca
46	Bolívar	Cauca
47	Buenos Aires	Cauca
48	Cajibío	Cauca
49	Caldono	Cauca
50	Caloto	Cauca
51	Corinto	Cauca
52	El Tambo	Cauca
53	Florencia	Cauca
54	Guachené	Cauca
55	Guapi	Cauca
56	Inzá	Cauca
57	Jambaló	Cauca
58	La Sierra	Cauca
59	La Vega	Cauca
60	López de Micay	Cauca
61	Mercaderes	Cauca
62	Miranda	Cauca
63	Morales	Cauca
64	Padilla	Cauca
65	Páez	Cauca
66	Patía	Cauca
67	Piamonte	Cauca
68	Piendamó – Tunía	Cauca
69	Popayán (capital del departamento)	Cauca
70	Puerto Tejada	Cauca
71	Puracé (Coconuco)	Cauca
72	Rosas	Cauca
73	San Sebastián	Cauca
74	Santander de Quilichao	Cauca
75	Santa Rosa	Cauca
76	Silvia	Cauca
77	Sotará	Cauca
78	Suárez	Cauca
79	Sucre	Cauca
80	Timbío	Cauca
81	Timbiquí	Cauca
82	Toribío	Cauca
83	Totoró	Cauca
84	Villa Rica	Cauca
\.


--
-- Data for Name: votos; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.votos (id, id_directivo, id_candidato, fecha_voto, ip_votante) FROM stdin;
\.


--
-- Name: sq_administradores; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.sq_administradores', 1, true);


--
-- Name: sq_candidatos; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.sq_candidatos', 7, true);


--
-- Name: sq_directivos_docentes; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.sq_directivos_docentes', 7, true);


--
-- Name: sq_eleccion; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.sq_eleccion', 5, true);


--
-- Name: sq_municipios; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.sq_municipios', 84, true);


--
-- Name: sq_votos; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.sq_votos', 7, true);


--
-- Name: administradores administradores_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_pkey PRIMARY KEY (id);


--
-- Name: administradores administradores_usuario_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.administradores
    ADD CONSTRAINT administradores_usuario_key UNIQUE (usuario);


--
-- Name: candidatos candidatos_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.candidatos
    ADD CONSTRAINT candidatos_pkey PRIMARY KEY (id);


--
-- Name: directivos_docentes directivos_docentes_cedula_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.directivos_docentes
    ADD CONSTRAINT directivos_docentes_cedula_key UNIQUE (cedula);


--
-- Name: directivos_docentes directivos_docentes_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.directivos_docentes
    ADD CONSTRAINT directivos_docentes_pkey PRIMARY KEY (id);


--
-- Name: eleccion eleccion_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.eleccion
    ADD CONSTRAINT eleccion_pkey PRIMARY KEY (id);


--
-- Name: municipios municipios_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.municipios
    ADD CONSTRAINT municipios_pkey PRIMARY KEY (id);


--
-- Name: votos votos_id_directivo_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.votos
    ADD CONSTRAINT votos_id_directivo_key UNIQUE (id_directivo);


--
-- Name: votos votos_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.votos
    ADD CONSTRAINT votos_pkey PRIMARY KEY (id);


--
-- Name: votos trigger_voter_status_on_delete; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trigger_voter_status_on_delete AFTER DELETE ON public.votos FOR EACH ROW EXECUTE FUNCTION public.update_voter_status_on_delete();


--
-- Name: votos trigger_voter_status_on_insert; Type: TRIGGER; Schema: public; Owner: root
--

CREATE TRIGGER trigger_voter_status_on_insert AFTER INSERT ON public.votos FOR EACH ROW EXECUTE FUNCTION public.update_voter_status_on_insert();


--
-- Name: candidatos candidatos_municipio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.candidatos
    ADD CONSTRAINT candidatos_municipio_id_fkey FOREIGN KEY (municipio_id) REFERENCES public.municipios(id);


--
-- Name: directivos_docentes directivos_docentes_municipio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.directivos_docentes
    ADD CONSTRAINT directivos_docentes_municipio_id_fkey FOREIGN KEY (municipio_id) REFERENCES public.municipios(id);


--
-- Name: votos votos_id_candidato_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.votos
    ADD CONSTRAINT votos_id_candidato_fkey FOREIGN KEY (id_candidato) REFERENCES public.candidatos(id);


--
-- Name: votos votos_id_directivo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.votos
    ADD CONSTRAINT votos_id_directivo_fkey FOREIGN KEY (id_directivo) REFERENCES public.directivos_docentes(id);


--
-- PostgreSQL database dump complete
--

\unrestrict aCAIOgUOKnuPn0Jgs0tbL19WR0MmFq9sCvyB2USZXJ8Pb9rlAzRVPLIjg97Etue

