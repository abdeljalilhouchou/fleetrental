/*
 Navicat Premium Dump SQL

 Source Server         : postgres
 Source Server Type    : PostgreSQL
 Source Server Version : 180001 (180001)
 Source Host           : localhost:5432
 Source Catalog        : fleetrental
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 180001 (180001)
 File Encoding         : 65001

 Date: 15/02/2026 22:48:53
*/


-- ----------------------------
-- Sequence structure for companies_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."companies_id_seq";
CREATE SEQUENCE "public"."companies_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for failed_jobs_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."failed_jobs_id_seq";
CREATE SEQUENCE "public"."failed_jobs_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for jobs_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."jobs_id_seq";
CREATE SEQUENCE "public"."jobs_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for maintenance_files_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."maintenance_files_id_seq";
CREATE SEQUENCE "public"."maintenance_files_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for maintenance_reminders_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."maintenance_reminders_id_seq";
CREATE SEQUENCE "public"."maintenance_reminders_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for maintenances_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."maintenances_id_seq";
CREATE SEQUENCE "public"."maintenances_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for migrations_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."migrations_id_seq";
CREATE SEQUENCE "public"."migrations_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for personal_access_tokens_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."personal_access_tokens_id_seq";
CREATE SEQUENCE "public"."personal_access_tokens_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for rental_files_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."rental_files_id_seq";
CREATE SEQUENCE "public"."rental_files_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for rentals_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."rentals_id_seq";
CREATE SEQUENCE "public"."rentals_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for users_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."users_id_seq";
CREATE SEQUENCE "public"."users_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for vehicles_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."vehicles_id_seq";
CREATE SEQUENCE "public"."vehicles_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Table structure for cache
-- ----------------------------
DROP TABLE IF EXISTS "public"."cache";
CREATE TABLE "public"."cache" (
  "key" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "value" text COLLATE "pg_catalog"."default" NOT NULL,
  "expiration" int4 NOT NULL
)
;

-- ----------------------------
-- Records of cache
-- ----------------------------

-- ----------------------------
-- Table structure for cache_locks
-- ----------------------------
DROP TABLE IF EXISTS "public"."cache_locks";
CREATE TABLE "public"."cache_locks" (
  "key" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "owner" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "expiration" int4 NOT NULL
)
;

-- ----------------------------
-- Records of cache_locks
-- ----------------------------

-- ----------------------------
-- Table structure for companies
-- ----------------------------
DROP TABLE IF EXISTS "public"."companies";
CREATE TABLE "public"."companies" (
  "id" int8 NOT NULL DEFAULT nextval('companies_id_seq'::regclass),
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "email" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "phone" varchar(255) COLLATE "pg_catalog"."default",
  "address" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(0),
  "updated_at" timestamp(0),
  "logo" varchar(255) COLLATE "pg_catalog"."default",
  "city" varchar(255) COLLATE "pg_catalog"."default",
  "postal_code" varchar(255) COLLATE "pg_catalog"."default",
  "country" varchar(255) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of companies
-- ----------------------------
INSERT INTO "public"."companies" VALUES (1, 'AutoLoc Paris', 'contact@autoloc.com', NULL, NULL, '2026-01-31 12:07:13', '2026-01-31 12:07:13', NULL, NULL, NULL, NULL);
INSERT INTO "public"."companies" VALUES (2, 'societe manaoui', 'manaoui@gmail.com', '0623823750', 'boured taza', '2026-01-31 16:31:06', '2026-01-31 16:31:06', NULL, NULL, NULL, NULL);

-- ----------------------------
-- Table structure for failed_jobs
-- ----------------------------
DROP TABLE IF EXISTS "public"."failed_jobs";
CREATE TABLE "public"."failed_jobs" (
  "id" int8 NOT NULL DEFAULT nextval('failed_jobs_id_seq'::regclass),
  "uuid" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "connection" text COLLATE "pg_catalog"."default" NOT NULL,
  "queue" text COLLATE "pg_catalog"."default" NOT NULL,
  "payload" text COLLATE "pg_catalog"."default" NOT NULL,
  "exception" text COLLATE "pg_catalog"."default" NOT NULL,
  "failed_at" timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;

-- ----------------------------
-- Records of failed_jobs
-- ----------------------------

-- ----------------------------
-- Table structure for job_batches
-- ----------------------------
DROP TABLE IF EXISTS "public"."job_batches";
CREATE TABLE "public"."job_batches" (
  "id" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "total_jobs" int4 NOT NULL,
  "pending_jobs" int4 NOT NULL,
  "failed_jobs" int4 NOT NULL,
  "failed_job_ids" text COLLATE "pg_catalog"."default" NOT NULL,
  "options" text COLLATE "pg_catalog"."default",
  "cancelled_at" int4,
  "created_at" int4 NOT NULL,
  "finished_at" int4
)
;

-- ----------------------------
-- Records of job_batches
-- ----------------------------

-- ----------------------------
-- Table structure for jobs
-- ----------------------------
DROP TABLE IF EXISTS "public"."jobs";
CREATE TABLE "public"."jobs" (
  "id" int8 NOT NULL DEFAULT nextval('jobs_id_seq'::regclass),
  "queue" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "payload" text COLLATE "pg_catalog"."default" NOT NULL,
  "attempts" int2 NOT NULL,
  "reserved_at" int4,
  "available_at" int4 NOT NULL,
  "created_at" int4 NOT NULL
)
;

-- ----------------------------
-- Records of jobs
-- ----------------------------

-- ----------------------------
-- Table structure for maintenance_files
-- ----------------------------
DROP TABLE IF EXISTS "public"."maintenance_files";
CREATE TABLE "public"."maintenance_files" (
  "id" int8 NOT NULL DEFAULT nextval('maintenance_files_id_seq'::regclass),
  "maintenance_id" int8 NOT NULL,
  "file_path" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "file_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "file_type" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "file_size" int8,
  "created_at" timestamp(0),
  "updated_at" timestamp(0)
)
;

-- ----------------------------
-- Records of maintenance_files
-- ----------------------------
INSERT INTO "public"."maintenance_files" VALUES (2, 3, 'maintenance_files/S2IJTubH1EqpBAWPPyUbVTNIzzNJjB0S46x3F89e.jpg', 'HBgame.jpg', 'image/jpeg', 251073, '2026-02-03 10:05:31', '2026-02-03 10:05:31');
INSERT INTO "public"."maintenance_files" VALUES (3, 2, 'maintenance_files/9l9WUbNiVDgpFJgRddyMOMdePV8COzbaDi3QIjVq.webp', 'd521cf93e0fd37f8047aea234a1d5321.png', 'image/webp', 272344, '2026-02-03 10:11:37', '2026-02-03 10:11:37');
INSERT INTO "public"."maintenance_files" VALUES (4, 4, 'maintenance_files/xQQDAbP1YAzgq53NgkXPUze9oFii2w6lPqd7aS1V.jpg', 'HBgame.jpg', 'image/jpeg', 251073, '2026-02-03 18:49:33', '2026-02-03 18:49:33');

-- ----------------------------
-- Table structure for maintenance_reminders
-- ----------------------------
DROP TABLE IF EXISTS "public"."maintenance_reminders";
CREATE TABLE "public"."maintenance_reminders" (
  "id" int8 NOT NULL DEFAULT nextval('maintenance_reminders_id_seq'::regclass),
  "vehicle_id" int8 NOT NULL,
  "type" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "next_due_mileage" int4,
  "next_due_date" date,
  "is_active" bool NOT NULL DEFAULT true,
  "created_at" timestamp(0),
  "updated_at" timestamp(0)
)
;

-- ----------------------------
-- Records of maintenance_reminders
-- ----------------------------
INSERT INTO "public"."maintenance_reminders" VALUES (1, 1, 'Vidange', 'hhh', 2100, '2026-07-31', 't', '2026-01-31 15:45:59', '2026-01-31 15:51:59');
INSERT INTO "public"."maintenance_reminders" VALUES (5, 7, 'Batterie', NULL, 1300, '2026-05-07', 't', '2026-02-03 09:58:44', '2026-02-03 09:58:44');
INSERT INTO "public"."maintenance_reminders" VALUES (6, 7, 'Vidange', '''"((y-uèiyuoo', 1700, '2026-02-27', 't', '2026-02-03 18:01:30', '2026-02-03 18:01:30');
INSERT INTO "public"."maintenance_reminders" VALUES (2, 2, 'Vidange', NULL, 12000, '2026-08-03', 't', '2026-02-02 09:32:38', '2026-02-03 18:37:38');
INSERT INTO "public"."maintenance_reminders" VALUES (3, 7, 'Freins', NULL, 31701, '2028-02-03', 't', '2026-02-02 09:33:30', '2026-02-03 18:37:44');
INSERT INTO "public"."maintenance_reminders" VALUES (4, 2, 'Pneus', NULL, 42000, '2029-02-03', 't', '2026-02-02 15:12:23', '2026-02-03 18:37:50');

-- ----------------------------
-- Table structure for maintenances
-- ----------------------------
DROP TABLE IF EXISTS "public"."maintenances";
CREATE TABLE "public"."maintenances" (
  "id" int8 NOT NULL DEFAULT nextval('maintenances_id_seq'::regclass),
  "vehicle_id" int8 NOT NULL,
  "type" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "cost" numeric(10,2) NOT NULL DEFAULT '0'::numeric,
  "date" date NOT NULL,
  "mileage_at_maintenance" int4 NOT NULL,
  "invoice_path" varchar(255) COLLATE "pg_catalog"."default",
  "created_at" timestamp(0),
  "updated_at" timestamp(0),
  "status" varchar(255) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'in_progress'::character varying
)
;

-- ----------------------------
-- Records of maintenances
-- ----------------------------
INSERT INTO "public"."maintenances" VALUES (1, 1, 'Freins', 'maintenance en freins', 1.00, '2026-01-31', 10, NULL, '2026-01-31 12:54:23', '2026-01-31 15:31:41', 'completed');
INSERT INTO "public"."maintenances" VALUES (2, 2, 'Vidange', 'faire vidange obliger', 10.00, '2026-02-01', 109, NULL, '2026-02-01 02:27:13', '2026-02-01 02:29:23', 'completed');
INSERT INTO "public"."maintenances" VALUES (3, 2, 'Vidange', NULL, 4.00, '2026-02-02', 1110, NULL, '2026-02-02 15:14:31', '2026-02-02 15:15:13', 'completed');
INSERT INTO "public"."maintenances" VALUES (4, 7, 'Freins', NULL, 110.00, '2026-02-03', 1201, NULL, '2026-02-03 10:13:35', '2026-02-03 10:14:28', 'completed');
INSERT INTO "public"."maintenances" VALUES (5, 2, 'Pneus', NULL, 0.00, '2026-02-03', 0, NULL, '2026-02-03 10:37:23', '2026-02-03 10:37:47', 'completed');
INSERT INTO "public"."maintenances" VALUES (6, 2, 'Vidange', 'rzetyui', 100.00, '2026-02-03', 10, NULL, '2026-02-03 17:59:07', '2026-02-03 18:57:25', 'completed');

-- ----------------------------
-- Table structure for migrations
-- ----------------------------
DROP TABLE IF EXISTS "public"."migrations";
CREATE TABLE "public"."migrations" (
  "id" int4 NOT NULL DEFAULT nextval('migrations_id_seq'::regclass),
  "migration" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "batch" int4 NOT NULL
)
;

-- ----------------------------
-- Records of migrations
-- ----------------------------
INSERT INTO "public"."migrations" VALUES (1, '0001_01_01_000000_create_users_table', 1);
INSERT INTO "public"."migrations" VALUES (2, '0001_01_01_000001_create_cache_table', 1);
INSERT INTO "public"."migrations" VALUES (3, '0001_01_01_000002_create_jobs_table', 1);
INSERT INTO "public"."migrations" VALUES (4, '2026_01_31_112920_create_personal_access_tokens_table', 2);
INSERT INTO "public"."migrations" VALUES (5, '2026_01_31_115312_create_companies_table', 3);
INSERT INTO "public"."migrations" VALUES (6, '2026_01_31_115335_create_vehicles_table', 4);
INSERT INTO "public"."migrations" VALUES (7, '2026_01_31_115336_create_maintenances_table', 4);
INSERT INTO "public"."migrations" VALUES (8, '2026_01_31_115604_create_maintenance_reminders_table', 4);
INSERT INTO "public"."migrations" VALUES (9, '2026_01_31_115648_add_company_and_role_to_users_table', 4);
INSERT INTO "public"."migrations" VALUES (10, '2026_01_31_152402_add_status_to_maintenances_table', 5);
INSERT INTO "public"."migrations" VALUES (11, '2026_01_31_155420_create_maintenance_files_table', 6);
INSERT INTO "public"."migrations" VALUES (12, '2026_01_31_160945_add_is_super_admin_to_users_table', 7);
INSERT INTO "public"."migrations" VALUES (13, '2026_01_31_160954_add_fields_to_companies_table', 8);
INSERT INTO "public"."migrations" VALUES (14, '2026_01_31_213435_remove_is_super_admin_from_users_table', 9);
INSERT INTO "public"."migrations" VALUES (15, '2026_01_31_214547_fix_role_column_constraint', 10);
INSERT INTO "public"."migrations" VALUES (16, '2026_02_01_160000_create_rentals_table', 11);
INSERT INTO "public"."migrations" VALUES (17, '2026_02_01_HHMMSS_add_profile_settings_columns', 12);
INSERT INTO "public"."migrations" VALUES (18, '2026_02_01_191859_add_profile_settings_columns_v2', 13);
INSERT INTO "public"."migrations" VALUES (19, '2026_02_03_084525_add_profile_fields_to_users_table', 14);
INSERT INTO "public"."migrations" VALUES (20, '2026_02_03_120000_add_preferences_to_users_table', 15);
INSERT INTO "public"."migrations" VALUES (21, '2026_02_04_000000_create_rental_files_table', 16);

-- ----------------------------
-- Table structure for password_reset_tokens
-- ----------------------------
DROP TABLE IF EXISTS "public"."password_reset_tokens";
CREATE TABLE "public"."password_reset_tokens" (
  "email" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "token" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamp(0)
)
;

-- ----------------------------
-- Records of password_reset_tokens
-- ----------------------------

-- ----------------------------
-- Table structure for personal_access_tokens
-- ----------------------------
DROP TABLE IF EXISTS "public"."personal_access_tokens";
CREATE TABLE "public"."personal_access_tokens" (
  "id" int8 NOT NULL DEFAULT nextval('personal_access_tokens_id_seq'::regclass),
  "tokenable_type" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "tokenable_id" int8 NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "token" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "abilities" text COLLATE "pg_catalog"."default",
  "last_used_at" timestamp(0),
  "expires_at" timestamp(0),
  "created_at" timestamp(0),
  "updated_at" timestamp(0)
)
;

-- ----------------------------
-- Records of personal_access_tokens
-- ----------------------------
INSERT INTO "public"."personal_access_tokens" VALUES (1, 'App\Models\User', 1, 'auth-token', '0bee57efaf4e000140c271cdaccf24fadf6656b1bc43e42956606106982a98a3', '["*"]', '2026-01-31 12:55:55', NULL, '2026-01-31 11:52:09', '2026-01-31 12:55:55');
INSERT INTO "public"."personal_access_tokens" VALUES (30, 'App\Models\User', 3, 'auth_token', '131f066b1d8560cdb25346f7f21c30ebfbee0eab5a7ab38f901dce21684fbb3c', '["*"]', '2026-02-02 09:35:54', NULL, '2026-02-02 09:34:34', '2026-02-02 09:35:54');
INSERT INTO "public"."personal_access_tokens" VALUES (28, 'App\Models\User', 3, 'auth_token', '517b6ced2fb89c5c21249bd46566468b5045d02a7f5994278d989403aca075cf', '["*"]', '2026-02-02 09:29:58', NULL, '2026-02-02 09:26:08', '2026-02-02 09:29:58');
INSERT INTO "public"."personal_access_tokens" VALUES (21, 'App\Models\User', 3, 'auth_token', '8da4f795ea743f21e7b1f6c52c43b4ffc1198f4181fb0a2d18cd376ae4f3fe3b', '["*"]', '2026-02-01 18:54:46', NULL, '2026-02-01 17:57:54', '2026-02-01 18:54:46');
INSERT INTO "public"."personal_access_tokens" VALUES (13, 'App\Models\User', 1, 'auth_token', 'bcd6d82ab275e3e7fd5ebc9cdbdaa35632bfc4778f9e48fd0cc676df79bf4f87', '["*"]', '2026-01-31 23:05:08', NULL, '2026-01-31 23:02:51', '2026-01-31 23:05:08');
INSERT INTO "public"."personal_access_tokens" VALUES (22, 'App\Models\User', 3, 'auth_token', 'b7f0a5cdaf8668caf8651e43f7e344d911aa54dfe194404826493a52cf1408e2', '["*"]', NULL, NULL, '2026-02-01 19:13:58', '2026-02-01 19:13:58');
INSERT INTO "public"."personal_access_tokens" VALUES (4, 'App\Models\User', 1, 'auth-token', '61e616e3f5e6c56f90dc9e131ba18e847b7992cfd0af412752391017866727a8', '["*"]', '2026-01-31 16:31:55', NULL, '2026-01-31 16:04:43', '2026-01-31 16:31:55');
INSERT INTO "public"."personal_access_tokens" VALUES (25, 'App\Models\User', 3, 'auth_token', '147277be95f1611a5d00bbfadb94951ddfa050e3c17fef02da2c07b7f5cb841a', '["*"]', '2026-02-01 23:18:25', NULL, '2026-02-01 23:15:13', '2026-02-01 23:18:25');
INSERT INTO "public"."personal_access_tokens" VALUES (41, 'App\Models\User', 3, 'auth_token', '1623240c6ad18886ef6a430eef72ee1ab2db83e392249856f5c28980e753f482', '["*"]', '2026-02-03 09:01:55', NULL, '2026-02-03 08:20:06', '2026-02-03 09:01:55');
INSERT INTO "public"."personal_access_tokens" VALUES (27, 'App\Models\User', 3, 'auth_token', '6d9960b7ec11ebd14cc2d5c03fd36563b3d03e353bafe268939d889a2f4d9872', '["*"]', '2026-02-03 09:44:44', NULL, '2026-02-02 09:22:52', '2026-02-03 09:44:44');
INSERT INTO "public"."personal_access_tokens" VALUES (36, 'App\Models\User', 1, 'auth_token', 'ea826bf6d1283886026656d83ec89b608a924dc21a3b78c5420ddbed7566ff85', '["*"]', '2026-02-02 13:48:14', NULL, '2026-02-02 13:47:24', '2026-02-02 13:48:14');
INSERT INTO "public"."personal_access_tokens" VALUES (3, 'App\Models\User', 1, 'auth-token', 'f751930aa519d2f001efc374273764b7f766034d6b656194c149a9087a3b9c55', '["*"]', '2026-01-31 15:52:35', NULL, '2026-01-31 15:41:01', '2026-01-31 15:52:35');
INSERT INTO "public"."personal_access_tokens" VALUES (2, 'App\Models\User', 1, 'auth-token', '9458b250dec9b84304550a4a69dad7bd4b7455bb38debdc1817acae4733e2839', '["*"]', '2026-01-31 15:32:12', NULL, '2026-01-31 15:14:40', '2026-01-31 15:32:12');
INSERT INTO "public"."personal_access_tokens" VALUES (15, 'App\Models\User', 3, 'auth_token', 'f099d695128eeab7aa022102778b7a973fc762415606718656c70a43fa074b05', '["*"]', '2026-02-01 03:05:23', NULL, '2026-02-01 03:04:05', '2026-02-01 03:05:23');
INSERT INTO "public"."personal_access_tokens" VALUES (33, 'App\Models\User', 3, 'auth_token', 'a275f7a321c6a7d11fb84c00a0a64169ca8417394d8b5d8f90a7150d155655f9', '["*"]', '2026-02-02 09:54:05', NULL, '2026-02-02 09:40:49', '2026-02-02 09:54:05');
INSERT INTO "public"."personal_access_tokens" VALUES (34, 'App\Models\User', 3, 'auth_token', '73978db1e8abc1c35d99fe5eeff9f167b59625f72497ad497e104d4ddb15e86a', '["*"]', NULL, NULL, '2026-02-02 13:42:33', '2026-02-02 13:42:33');
INSERT INTO "public"."personal_access_tokens" VALUES (44, 'App\Models\User', 1, 'auth_token', '16441a894b6be06705fb5f50e1c01a6de1ca9b7554edf340f3ae6b9de1947c9d', '["*"]', '2026-02-03 10:44:42', NULL, '2026-02-03 10:38:48', '2026-02-03 10:44:42');
INSERT INTO "public"."personal_access_tokens" VALUES (26, 'App\Models\User', 3, 'auth_token', 'd314f8e5f0dccbb2f9b71cec8a886dca8d4479615c863491d417443196c290d6', '["*"]', '2026-02-01 23:18:57', NULL, '2026-02-01 23:18:42', '2026-02-01 23:18:57');
INSERT INTO "public"."personal_access_tokens" VALUES (20, 'App\Models\User', 3, 'auth_token', '159cb657a3276a8d0d085756b253a2d4eea749521122b971ae776493f01a5753', '["*"]', '2026-02-01 15:14:00', NULL, '2026-02-01 15:13:50', '2026-02-01 15:14:00');
INSERT INTO "public"."personal_access_tokens" VALUES (24, 'App\Models\User', 1, 'auth_token', 'd67e5212d075433c41f8ef955c366d7b3cb7e893c8f2e066c284357207f79f40', '["*"]', '2026-02-01 19:32:42', NULL, '2026-02-01 19:31:43', '2026-02-01 19:32:42');
INSERT INTO "public"."personal_access_tokens" VALUES (29, 'App\Models\User', 3, 'auth_token', 'de2b18c0769c739bf6abfe3d9885eda01dded788e7a79629ebe16b82baab6aaa', '["*"]', '2026-02-02 09:34:17', NULL, '2026-02-02 09:30:12', '2026-02-02 09:34:17');
INSERT INTO "public"."personal_access_tokens" VALUES (38, 'App\Models\User', 5, 'auth_token', '03e570511dc00afcd3c33c0256e8aa18ebfb54e9f0ee954c5a853dd938904ee0', '["*"]', '2026-02-02 13:51:00', NULL, '2026-02-02 13:49:51', '2026-02-02 13:51:00');
INSERT INTO "public"."personal_access_tokens" VALUES (42, 'App\Models\User', 3, 'auth_token', '10debc1e0ccccaa207ab32dd9e9d017abb6b08c1b297e254f21ec5b591b74866', '["*"]', '2026-02-03 09:03:56', NULL, '2026-02-03 09:03:47', '2026-02-03 09:03:56');
INSERT INTO "public"."personal_access_tokens" VALUES (39, 'App\Models\User', 3, 'auth_token', '731f87b3fa9390ed7b7647e010014dad8b8ec5a3b021ddf0e60bba8079f8dd6b', '["*"]', '2026-02-02 15:12:24', NULL, '2026-02-02 14:49:57', '2026-02-02 15:12:24');
INSERT INTO "public"."personal_access_tokens" VALUES (45, 'App\Models\User', 1, 'auth_token', '46e466da277143714edbc63dbee95186ad8058a7fc2b7b8d2eb7c8676660d2ca', '["*"]', '2026-02-03 14:56:46', NULL, '2026-02-03 10:45:05', '2026-02-03 14:56:46');
INSERT INTO "public"."personal_access_tokens" VALUES (57, 'App\Models\User', 3, 'auth_token', 'e6905c24a1072472d6843f964c0af45f6a7e99b37367e178a74d41e87d74accd', '["*"]', '2026-02-04 21:03:46', NULL, '2026-02-04 19:43:00', '2026-02-04 21:03:46');
INSERT INTO "public"."personal_access_tokens" VALUES (49, 'App\Models\User', 3, 'auth_token', '06c13a2ab9167d56cd4917d3d9094590a56c239569bfd0ac888b22368f408ab9', '["*"]', '2026-02-03 19:04:53', NULL, '2026-02-03 18:22:38', '2026-02-03 19:04:53');
INSERT INTO "public"."personal_access_tokens" VALUES (40, 'App\Models\User', 3, 'auth_token', '4bb18b271cc62f6a17acd64ce80c5e2c12ac117f65207633c7735009b3c17c45', '["*"]', '2026-02-02 15:16:15', NULL, '2026-02-02 15:12:54', '2026-02-02 15:16:15');
INSERT INTO "public"."personal_access_tokens" VALUES (62, 'App\Models\User', 3, 'auth_token', '1ec467a336cd597000eabb790b1558dd081591506a08f89dac22e6f39530734e', '["*"]', '2026-02-05 19:46:31', NULL, '2026-02-05 19:46:22', '2026-02-05 19:46:31');
INSERT INTO "public"."personal_access_tokens" VALUES (50, 'App\Models\User', 3, 'auth_token', 'c25ae877495d4d8b1f344627157321b6314653623163bcf0abbffb6129b1bee1', '["*"]', '2026-02-04 07:47:41', NULL, '2026-02-04 07:44:31', '2026-02-04 07:47:41');
INSERT INTO "public"."personal_access_tokens" VALUES (58, 'App\Models\User', 4, 'test', '5f05bb30ac4f5de6530eefe1bc47a389b12ca157d03f0735c034373b7f8bc1a0', '["*"]', NULL, NULL, '2026-02-04 20:15:02', '2026-02-04 20:15:02');
INSERT INTO "public"."personal_access_tokens" VALUES (53, 'App\Models\User', 3, 'auth_token', '3169774bde990ee4225ab258517da1f73d82fba1f6b55541bdd60ee8d27e8f41', '["*"]', '2026-02-04 08:01:54', NULL, '2026-02-04 08:01:41', '2026-02-04 08:01:54');
INSERT INTO "public"."personal_access_tokens" VALUES (60, 'App\Models\User', 3, 'pref-test', '8615a8bf2d77f09072e74bfbb1af5c5f32efad28f1e7ab89ce9033eb998fe48c', '["*"]', '2026-02-04 20:37:22', NULL, '2026-02-04 20:37:10', '2026-02-04 20:37:22');
INSERT INTO "public"."personal_access_tokens" VALUES (55, 'App\Models\User', 3, 'auth_token', '1e689b7c4cb27accb932c5f708c14c8fb540b15568da041617a7a7cc60814fe6', '["*"]', '2026-02-04 10:38:49', NULL, '2026-02-04 10:38:41', '2026-02-04 10:38:49');
INSERT INTO "public"."personal_access_tokens" VALUES (59, 'App\Models\User', 3, 'test2', 'b2b2b5ce462c4158dcc3d1a318a7eb69afbe8fa3bb0ed0dce4f5ac4efc3c0df3', '["*"]', '2026-02-04 20:16:10', NULL, '2026-02-04 20:15:22', '2026-02-04 20:16:10');
INSERT INTO "public"."personal_access_tokens" VALUES (61, 'App\Models\User', 3, 'auth_token', '82a6f68d48409b3b086faadba816d08f94af89874cdb4d02ba47f1c5816305ef', '["*"]', '2026-02-05 15:04:07', NULL, '2026-02-05 15:03:48', '2026-02-05 15:04:07');

-- ----------------------------
-- Table structure for rental_files
-- ----------------------------
DROP TABLE IF EXISTS "public"."rental_files";
CREATE TABLE "public"."rental_files" (
  "id" int8 NOT NULL DEFAULT nextval('rental_files_id_seq'::regclass),
  "rental_id" int8 NOT NULL,
  "file_path" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "file_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "file_type" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "file_size" int8,
  "created_at" timestamp(0),
  "updated_at" timestamp(0)
)
;

-- ----------------------------
-- Records of rental_files
-- ----------------------------

-- ----------------------------
-- Table structure for rentals
-- ----------------------------
DROP TABLE IF EXISTS "public"."rentals";
CREATE TABLE "public"."rentals" (
  "id" int8 NOT NULL DEFAULT nextval('rentals_id_seq'::regclass),
  "company_id" int8 NOT NULL,
  "vehicle_id" int8 NOT NULL,
  "customer_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "customer_phone" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "customer_email" varchar(255) COLLATE "pg_catalog"."default",
  "customer_address" text COLLATE "pg_catalog"."default",
  "customer_id_card" varchar(255) COLLATE "pg_catalog"."default",
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "start_mileage" int4 NOT NULL,
  "end_mileage" int4,
  "daily_rate" numeric(10,2) NOT NULL,
  "total_price" numeric(10,2) NOT NULL,
  "deposit_amount" numeric(10,2) NOT NULL,
  "paid_amount" numeric(10,2) NOT NULL DEFAULT '0'::numeric,
  "status" varchar(255) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'ongoing'::character varying,
  "notes" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(0),
  "updated_at" timestamp(0)
)
;

-- ----------------------------
-- Records of rentals
-- ----------------------------
INSERT INTO "public"."rentals" VALUES (2, 2, 2, 'adil hounchou', '0623823750', 'ADIL.HOUNCHOU@gmail.com', 'dr boured ajdir taza', 'Z666814', '2026-02-01', '2026-02-05', 109, 109, 300.00, 1500.00, 0.00, 1500.00, 'completed', NULL, '2026-02-01 14:48:55', '2026-02-01 18:36:58');
INSERT INTO "public"."rentals" VALUES (3, 2, 7, 'hamza', '0876446889', NULL, 'dfsdsq', 'Z34567', '2026-02-02', '2026-02-04', 1000, 1100, 248.00, 744.00, 0.00, 700.00, 'completed', NULL, '2026-02-02 09:29:51', '2026-02-02 09:31:12');
INSERT INTO "public"."rentals" VALUES (4, 2, 7, 'dyhqr', '456789', NULL, NULL, 'R45678', '2026-02-02', '2026-02-03', 1100, 1201, 248.00, 496.00, 0.00, 496.00, 'completed', NULL, '2026-02-02 09:34:14', '2026-02-02 09:35:02');
INSERT INTO "public"."rentals" VALUES (5, 2, 7, 'hassani', '9876543', NULL, 'hajeb', 'z23456', '2026-02-03', '2026-02-05', 1202, 1701, 250.00, 750.00, 0.00, 700.00, 'completed', NULL, '2026-02-03 17:57:28', '2026-02-03 18:02:48');
INSERT INTO "public"."rentals" VALUES (6, 2, 2, 'chablaoui', '06724453638', NULL, NULL, 'A12345678', '2026-02-04', '2026-02-12', 2000, NULL, 300.00, 2700.00, 0.00, 0.00, 'ongoing', NULL, '2026-02-04 20:32:56', '2026-02-04 20:32:56');

-- ----------------------------
-- Table structure for sessions
-- ----------------------------
DROP TABLE IF EXISTS "public"."sessions";
CREATE TABLE "public"."sessions" (
  "id" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" int8,
  "ip_address" varchar(45) COLLATE "pg_catalog"."default",
  "user_agent" text COLLATE "pg_catalog"."default",
  "payload" text COLLATE "pg_catalog"."default" NOT NULL,
  "last_activity" int4 NOT NULL
)
;

-- ----------------------------
-- Records of sessions
-- ----------------------------

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "public"."users";
CREATE TABLE "public"."users" (
  "id" int8 NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "email" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "email_verified_at" timestamp(0),
  "password" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "remember_token" varchar(100) COLLATE "pg_catalog"."default",
  "created_at" timestamp(0),
  "updated_at" timestamp(0),
  "company_id" int8,
  "role" varchar(255) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'employee'::character varying,
  "avatar" varchar(255) COLLATE "pg_catalog"."default",
  "phone" varchar(255) COLLATE "pg_catalog"."default",
  "address" text COLLATE "pg_catalog"."default",
  "birthdate" date,
  "theme" varchar(255) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'light'::character varying,
  "language" varchar(255) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'fr'::character varying,
  "notifications_email" bool NOT NULL DEFAULT true,
  "notifications_maintenance" bool NOT NULL DEFAULT true,
  "notifications_rental" bool NOT NULL DEFAULT true
)
;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO "public"."users" VALUES (1, 'Super Admin', 'admin@fleetrental.com', NULL, '$2y$12$I5tBeVKtibGCczN51.6cBeXQSUeobd1fSR6K1UXjxfHpM4wvnQOhi', NULL, '2026-01-31 11:38:48', '2026-01-31 16:21:47', 1, 'super_admin', NULL, NULL, NULL, NULL, 'light', 'fr', 't', 't', 't');
INSERT INTO "public"."users" VALUES (4, 'saidi', 'saidi@gmail.com', NULL, '$2y$12$8dLZKiYWMmfZVxGRMJR68eJcQJUbAOoSVG8BD/09F/VvGoj/6F6IW', NULL, '2026-01-31 22:55:14', '2026-01-31 22:55:14', 1, 'company_admin', NULL, NULL, NULL, NULL, 'light', 'fr', 't', 't', 't');
INSERT INTO "public"."users" VALUES (5, 'moussaoui', 'moussaoui@gmail.com', NULL, '$2y$12$65Xb25JldOMae9qmDQkOzO6JZFPm1fq3udQJovKh1/leUjGQcVRBO', NULL, '2026-01-31 22:59:04', '2026-01-31 22:59:04', 2, 'employee', NULL, NULL, NULL, NULL, 'light', 'fr', 't', 't', 't');
INSERT INTO "public"."users" VALUES (3, 'houchou', 'houchou@gmail.com', NULL, '$2y$12$oT/POB5p.qYZLxBgPNpy8.AUo9cwAbyU/gFFeJUtQUxGdgnlXNqZ2', NULL, '2026-01-31 21:46:38', '2026-02-04 20:37:22', 2, 'company_admin', 'avatars/uFTiXARzpzfuotV2XZWzLdN7NdhNBkEyZJHzlEZP.jpg', '0623823750', NULL, NULL, 'dark', 'en', 'f', 't', 'f');

-- ----------------------------
-- Table structure for vehicles
-- ----------------------------
DROP TABLE IF EXISTS "public"."vehicles";
CREATE TABLE "public"."vehicles" (
  "id" int8 NOT NULL DEFAULT nextval('vehicles_id_seq'::regclass),
  "company_id" int8 NOT NULL,
  "brand" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "model" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "year" int4 NOT NULL,
  "color" varchar(255) COLLATE "pg_catalog"."default",
  "registration_number" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "current_mileage" int4 NOT NULL DEFAULT 0,
  "status" varchar(255) COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'available'::character varying,
  "created_at" timestamp(0),
  "updated_at" timestamp(0),
  "vin" varchar(255) COLLATE "pg_catalog"."default",
  "purchase_date" date,
  "vehicle_type" varchar(100) COLLATE "pg_catalog"."default",
  "daily_rate" numeric(10,2) DEFAULT 0,
  "photo" varchar(500) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Records of vehicles
-- ----------------------------
INSERT INTO "public"."vehicles" VALUES (1, 1, 'mercedes', 'G63', 2026, 'rouge', 'AB-654-CD', 1100, 'available', '2026-01-31 12:14:24', '2026-01-31 15:46:35', NULL, NULL, NULL, 0.00, NULL);
INSERT INTO "public"."vehicles" VALUES (7, 2, 'renault', '2023', 2026, NULL, '345678', 1701, 'available', '2026-02-01 15:07:44', '2026-02-04 19:51:27', 'rrrrrrrrr', '2025-11-20', 'C3', 248.00, 'vehicle_photos/sUj8Tazqwfth7D0vwEdzWgdbTprdtnJUDnfm7mh9.jpg');
INSERT INTO "public"."vehicles" VALUES (2, 2, 'Toyota', 'Camry', 2025, 'noir', 'HY56789', 2000, 'rented', '2026-01-31 22:57:58', '2026-02-04 20:32:56', 'VIN123456789', '2026-01-15', 'Berline', 300.00, 'vehicle_photos/Q1T8H0WplQqky5mr5ugdT5tkRC9FSqVmC6ksU5SF.jpg');

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."companies_id_seq"
OWNED BY "public"."companies"."id";
SELECT setval('"public"."companies_id_seq"', 2, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."failed_jobs_id_seq"
OWNED BY "public"."failed_jobs"."id";
SELECT setval('"public"."failed_jobs_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."jobs_id_seq"
OWNED BY "public"."jobs"."id";
SELECT setval('"public"."jobs_id_seq"', 1, false);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."maintenance_files_id_seq"
OWNED BY "public"."maintenance_files"."id";
SELECT setval('"public"."maintenance_files_id_seq"', 4, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."maintenance_reminders_id_seq"
OWNED BY "public"."maintenance_reminders"."id";
SELECT setval('"public"."maintenance_reminders_id_seq"', 6, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."maintenances_id_seq"
OWNED BY "public"."maintenances"."id";
SELECT setval('"public"."maintenances_id_seq"', 6, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."migrations_id_seq"
OWNED BY "public"."migrations"."id";
SELECT setval('"public"."migrations_id_seq"', 21, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."personal_access_tokens_id_seq"
OWNED BY "public"."personal_access_tokens"."id";
SELECT setval('"public"."personal_access_tokens_id_seq"', 64, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."rental_files_id_seq"
OWNED BY "public"."rental_files"."id";
SELECT setval('"public"."rental_files_id_seq"', 2, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."rentals_id_seq"
OWNED BY "public"."rentals"."id";
SELECT setval('"public"."rentals_id_seq"', 6, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."users_id_seq"
OWNED BY "public"."users"."id";
SELECT setval('"public"."users_id_seq"', 5, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."vehicles_id_seq"
OWNED BY "public"."vehicles"."id";
SELECT setval('"public"."vehicles_id_seq"', 7, true);

-- ----------------------------
-- Indexes structure for table cache
-- ----------------------------
CREATE INDEX "cache_expiration_index" ON "public"."cache" USING btree (
  "expiration" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table cache
-- ----------------------------
ALTER TABLE "public"."cache" ADD CONSTRAINT "cache_pkey" PRIMARY KEY ("key");

-- ----------------------------
-- Indexes structure for table cache_locks
-- ----------------------------
CREATE INDEX "cache_locks_expiration_index" ON "public"."cache_locks" USING btree (
  "expiration" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table cache_locks
-- ----------------------------
ALTER TABLE "public"."cache_locks" ADD CONSTRAINT "cache_locks_pkey" PRIMARY KEY ("key");

-- ----------------------------
-- Primary Key structure for table companies
-- ----------------------------
ALTER TABLE "public"."companies" ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Uniques structure for table failed_jobs
-- ----------------------------
ALTER TABLE "public"."failed_jobs" ADD CONSTRAINT "failed_jobs_uuid_unique" UNIQUE ("uuid");

-- ----------------------------
-- Primary Key structure for table failed_jobs
-- ----------------------------
ALTER TABLE "public"."failed_jobs" ADD CONSTRAINT "failed_jobs_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table job_batches
-- ----------------------------
ALTER TABLE "public"."job_batches" ADD CONSTRAINT "job_batches_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table jobs
-- ----------------------------
CREATE INDEX "jobs_queue_index" ON "public"."jobs" USING btree (
  "queue" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table jobs
-- ----------------------------
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table maintenance_files
-- ----------------------------
ALTER TABLE "public"."maintenance_files" ADD CONSTRAINT "maintenance_files_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table maintenance_reminders
-- ----------------------------
ALTER TABLE "public"."maintenance_reminders" ADD CONSTRAINT "maintenance_reminders_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Checks structure for table maintenances
-- ----------------------------
ALTER TABLE "public"."maintenances" ADD CONSTRAINT "maintenances_status_check" CHECK (status::text = ANY (ARRAY['in_progress'::character varying, 'completed'::character varying]::text[]));

-- ----------------------------
-- Primary Key structure for table maintenances
-- ----------------------------
ALTER TABLE "public"."maintenances" ADD CONSTRAINT "maintenances_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table migrations
-- ----------------------------
ALTER TABLE "public"."migrations" ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table password_reset_tokens
-- ----------------------------
ALTER TABLE "public"."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("email");

-- ----------------------------
-- Indexes structure for table personal_access_tokens
-- ----------------------------
CREATE INDEX "personal_access_tokens_expires_at_index" ON "public"."personal_access_tokens" USING btree (
  "expires_at" "pg_catalog"."timestamp_ops" ASC NULLS LAST
);
CREATE INDEX "personal_access_tokens_tokenable_type_tokenable_id_index" ON "public"."personal_access_tokens" USING btree (
  "tokenable_type" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "tokenable_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Uniques structure for table personal_access_tokens
-- ----------------------------
ALTER TABLE "public"."personal_access_tokens" ADD CONSTRAINT "personal_access_tokens_token_unique" UNIQUE ("token");

-- ----------------------------
-- Primary Key structure for table personal_access_tokens
-- ----------------------------
ALTER TABLE "public"."personal_access_tokens" ADD CONSTRAINT "personal_access_tokens_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table rental_files
-- ----------------------------
ALTER TABLE "public"."rental_files" ADD CONSTRAINT "rental_files_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Checks structure for table rentals
-- ----------------------------
ALTER TABLE "public"."rentals" ADD CONSTRAINT "rentals_status_check" CHECK (status::text = ANY (ARRAY['ongoing'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[]));

-- ----------------------------
-- Primary Key structure for table rentals
-- ----------------------------
ALTER TABLE "public"."rentals" ADD CONSTRAINT "rentals_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table sessions
-- ----------------------------
CREATE INDEX "sessions_last_activity_index" ON "public"."sessions" USING btree (
  "last_activity" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE INDEX "sessions_user_id_index" ON "public"."sessions" USING btree (
  "user_id" "pg_catalog"."int8_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table sessions
-- ----------------------------
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Uniques structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_email_unique" UNIQUE ("email");

-- ----------------------------
-- Checks structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_role_check" CHECK (role::text = ANY (ARRAY['super_admin'::character varying, 'company_admin'::character varying, 'employee'::character varying]::text[]));

-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Checks structure for table vehicles
-- ----------------------------
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_status_check" CHECK (status::text = ANY (ARRAY['available'::character varying, 'rented'::character varying, 'maintenance'::character varying, 'out_of_service'::character varying]::text[]));

-- ----------------------------
-- Primary Key structure for table vehicles
-- ----------------------------
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table maintenance_files
-- ----------------------------
ALTER TABLE "public"."maintenance_files" ADD CONSTRAINT "maintenance_files_maintenance_id_foreign" FOREIGN KEY ("maintenance_id") REFERENCES "public"."maintenances" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table maintenance_reminders
-- ----------------------------
ALTER TABLE "public"."maintenance_reminders" ADD CONSTRAINT "maintenance_reminders_vehicle_id_foreign" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table maintenances
-- ----------------------------
ALTER TABLE "public"."maintenances" ADD CONSTRAINT "maintenances_vehicle_id_foreign" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table rental_files
-- ----------------------------
ALTER TABLE "public"."rental_files" ADD CONSTRAINT "rental_files_rental_id_foreign" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table rentals
-- ----------------------------
ALTER TABLE "public"."rentals" ADD CONSTRAINT "rentals_company_id_foreign" FOREIGN KEY ("company_id") REFERENCES "public"."companies" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."rentals" ADD CONSTRAINT "rentals_vehicle_id_foreign" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_company_id_foreign" FOREIGN KEY ("company_id") REFERENCES "public"."companies" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table vehicles
-- ----------------------------
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_company_id_foreign" FOREIGN KEY ("company_id") REFERENCES "public"."companies" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
