import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('en', 'fr', 'nl');
  CREATE TYPE "public"."enum_menu_categories_restaurant" AS ENUM('my-restaurant', 'verde-kitchen');
  CREATE TYPE "public"."enum_menu_items_restaurant" AS ENUM('my-restaurant', 'verde-kitchen');
  CREATE TYPE "public"."enum_media_restaurant" AS ENUM('my-restaurant', 'verde-kitchen');
  CREATE TYPE "public"."enum_sections_restaurant" AS ENUM('my-restaurant', 'verde-kitchen');
  CREATE TYPE "public"."enum_tables_restaurant" AS ENUM('my-restaurant', 'verde-kitchen');
  CREATE TYPE "public"."enum_tables_shape" AS ENUM('round', 'square', 'rectangle');
  CREATE TYPE "public"."enum_orders_restaurant" AS ENUM('my-restaurant', 'verde-kitchen');
  CREATE TYPE "public"."enum_orders_type" AS ENUM('takeaway', 'eat-in', 'delivery');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled');
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('cash', 'card');
  CREATE TYPE "public"."enum_reservations_restaurant" AS ENUM('my-restaurant', 'verde-kitchen');
  CREATE TYPE "public"."enum_reservations_type" AS ENUM('general', 'table');
  CREATE TYPE "public"."enum_reservations_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED');
  CREATE TYPE "public"."enum_contact_messages_restaurant" AS ENUM('my-restaurant', 'verde-kitchen');
  CREATE TYPE "public"."enum_admins_restaurant" AS ENUM('my-restaurant', 'verde-kitchen');
  CREATE TYPE "public"."enum_restaurants_slug" AS ENUM('my-restaurant', 'verde-kitchen');
  CREATE TYPE "public"."enum_restaurants_type" AS ENUM('eat-in', 'takeaway');
  CREATE TYPE "public"."enum_site_content_opening_hours_day" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
  CREATE TYPE "public"."enum_site_content_social_links_platform" AS ENUM('instagram', 'facebook', 'tiktok', 'twitter');
  CREATE TYPE "public"."enum_site_content_restaurant" AS ENUM('my-restaurant', 'verde-kitchen');
  CREATE TYPE "public"."enum_videos_restaurant" AS ENUM('my-restaurant', 'verde-kitchen');
  CREATE TYPE "public"."enum_promotions_restaurant" AS ENUM('my-restaurant', 'verde-kitchen');
  CREATE TABLE "menu_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"restaurant" "enum_menu_categories_restaurant" DEFAULT 'my-restaurant',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "menu_categories_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "menu_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"price" numeric NOT NULL,
  	"restaurant" "enum_menu_items_restaurant" DEFAULT 'my-restaurant',
  	"available" boolean DEFAULT true,
  	"category_id" integer NOT NULL,
  	"image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "menu_items_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"restaurant" "enum_media_restaurant",
  	"alt" varchar NOT NULL,
  	"prefix" varchar DEFAULT '',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar
  );
  
  CREATE TABLE "sections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"restaurant" "enum_sections_restaurant" DEFAULT 'my-restaurant',
  	"order" numeric DEFAULT 0,
  	"is_active" boolean DEFAULT true,
  	"background_image_id" integer,
  	"canvas_width" numeric DEFAULT 800,
  	"canvas_height" numeric DEFAULT 600,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tables" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"restaurant" "enum_tables_restaurant" DEFAULT 'my-restaurant',
  	"section_id" integer NOT NULL,
  	"capacity" numeric NOT NULL,
  	"shape" "enum_tables_shape" DEFAULT 'round' NOT NULL,
  	"x" numeric NOT NULL,
  	"y" numeric NOT NULL,
  	"width" numeric DEFAULT 8 NOT NULL,
  	"height" numeric DEFAULT 8 NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"price" numeric NOT NULL,
  	"quantity" numeric NOT NULL
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"restaurant" "enum_orders_restaurant",
  	"type" "enum_orders_type" NOT NULL,
  	"status" "enum_orders_status" DEFAULT 'pending' NOT NULL,
  	"customer_name" varchar NOT NULL,
  	"customer_phone" varchar NOT NULL,
  	"customer_email" varchar,
  	"total" numeric NOT NULL,
  	"table_number" varchar,
  	"pickup_time" varchar,
  	"delivery_street" varchar,
  	"delivery_city" varchar,
  	"delivery_postal_code" varchar,
  	"delivery_instructions" varchar,
  	"scheduled_for" timestamp(3) with time zone,
  	"notes" varchar,
  	"payment_method" "enum_orders_payment_method",
  	"stripe_session_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reservations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"restaurant" "enum_reservations_restaurant" NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"party_size" numeric NOT NULL,
  	"type" "enum_reservations_type" DEFAULT 'general' NOT NULL,
  	"table_id" integer,
  	"notes" varchar,
  	"status" "enum_reservations_status" DEFAULT 'PENDING' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contact_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"restaurant" "enum_contact_messages_restaurant" NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "admins_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "admins" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"restaurant" "enum_admins_restaurant",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"enable_a_p_i_key" boolean,
  	"api_key" varchar,
  	"api_key_index" varchar,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "restaurants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" "enum_restaurants_slug" NOT NULL,
  	"type" "enum_restaurants_type" NOT NULL,
  	"online_ordering" boolean DEFAULT false,
  	"stripe_secret_key" varchar,
  	"stripe_webhook_secret" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_content_opening_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" "enum_site_content_opening_hours_day" NOT NULL,
  	"open" varchar,
  	"close" varchar,
  	"closed" boolean DEFAULT false
  );
  
  CREATE TABLE "site_content_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_site_content_social_links_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"restaurant" "enum_site_content_restaurant",
  	"hero_image_id" integer,
  	"hero_video_id" integer,
  	"contact_phone" varchar,
  	"contact_email" varchar,
  	"contact_address" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_content_locales" (
  	"tagline" varchar,
  	"description" varchar,
  	"story" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "videos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"restaurant" "enum_videos_restaurant",
  	"prefix" varchar DEFAULT '',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "promotions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"restaurant" "enum_promotions_restaurant",
  	"active" boolean DEFAULT true,
  	"image_id" integer,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"dismiss_days" numeric DEFAULT 1,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "promotions_locales" (
  	"title" varchar NOT NULL,
  	"message" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"menu_categories_id" integer,
  	"menu_items_id" integer,
  	"media_id" integer,
  	"sections_id" integer,
  	"tables_id" integer,
  	"orders_id" integer,
  	"reservations_id" integer,
  	"contact_messages_id" integer,
  	"admins_id" integer,
  	"restaurants_id" integer,
  	"site_content_id" integer,
  	"videos_id" integer,
  	"promotions_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "menu_categories_locales" ADD CONSTRAINT "menu_categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "menu_items_locales" ADD CONSTRAINT "menu_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sections" ADD CONSTRAINT "sections_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tables" ADD CONSTRAINT "tables_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reservations" ADD CONSTRAINT "reservations_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "admins_sessions" ADD CONSTRAINT "admins_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_content_opening_hours" ADD CONSTRAINT "site_content_opening_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_content_social_links" ADD CONSTRAINT "site_content_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_content" ADD CONSTRAINT "site_content_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_content" ADD CONSTRAINT "site_content_hero_video_id_videos_id_fk" FOREIGN KEY ("hero_video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_content_locales" ADD CONSTRAINT "site_content_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "promotions" ADD CONSTRAINT "promotions_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "promotions_locales" ADD CONSTRAINT "promotions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_categories_fk" FOREIGN KEY ("menu_categories_id") REFERENCES "public"."menu_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_items_fk" FOREIGN KEY ("menu_items_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sections_fk" FOREIGN KEY ("sections_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tables_fk" FOREIGN KEY ("tables_id") REFERENCES "public"."tables"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reservations_fk" FOREIGN KEY ("reservations_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_messages_fk" FOREIGN KEY ("contact_messages_id") REFERENCES "public"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_restaurants_fk" FOREIGN KEY ("restaurants_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_site_content_fk" FOREIGN KEY ("site_content_id") REFERENCES "public"."site_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_promotions_fk" FOREIGN KEY ("promotions_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "menu_categories_updated_at_idx" ON "menu_categories" USING btree ("updated_at");
  CREATE INDEX "menu_categories_created_at_idx" ON "menu_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "menu_categories_locales_locale_parent_id_unique" ON "menu_categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "menu_items_category_idx" ON "menu_items" USING btree ("category_id");
  CREATE INDEX "menu_items_image_idx" ON "menu_items" USING btree ("image_id");
  CREATE INDEX "menu_items_updated_at_idx" ON "menu_items" USING btree ("updated_at");
  CREATE INDEX "menu_items_created_at_idx" ON "menu_items" USING btree ("created_at");
  CREATE UNIQUE INDEX "menu_items_locales_locale_parent_id_unique" ON "menu_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "sections_background_image_idx" ON "sections" USING btree ("background_image_id");
  CREATE INDEX "sections_updated_at_idx" ON "sections" USING btree ("updated_at");
  CREATE INDEX "sections_created_at_idx" ON "sections" USING btree ("created_at");
  CREATE INDEX "tables_section_idx" ON "tables" USING btree ("section_id");
  CREATE INDEX "tables_updated_at_idx" ON "tables" USING btree ("updated_at");
  CREATE INDEX "tables_created_at_idx" ON "tables" USING btree ("created_at");
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX "reservations_table_idx" ON "reservations" USING btree ("table_id");
  CREATE INDEX "reservations_updated_at_idx" ON "reservations" USING btree ("updated_at");
  CREATE INDEX "reservations_created_at_idx" ON "reservations" USING btree ("created_at");
  CREATE INDEX "contact_messages_updated_at_idx" ON "contact_messages" USING btree ("updated_at");
  CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages" USING btree ("created_at");
  CREATE INDEX "admins_sessions_order_idx" ON "admins_sessions" USING btree ("_order");
  CREATE INDEX "admins_sessions_parent_id_idx" ON "admins_sessions" USING btree ("_parent_id");
  CREATE INDEX "admins_updated_at_idx" ON "admins" USING btree ("updated_at");
  CREATE INDEX "admins_created_at_idx" ON "admins" USING btree ("created_at");
  CREATE UNIQUE INDEX "admins_email_idx" ON "admins" USING btree ("email");
  CREATE UNIQUE INDEX "restaurants_slug_idx" ON "restaurants" USING btree ("slug");
  CREATE INDEX "restaurants_updated_at_idx" ON "restaurants" USING btree ("updated_at");
  CREATE INDEX "restaurants_created_at_idx" ON "restaurants" USING btree ("created_at");
  CREATE INDEX "site_content_opening_hours_order_idx" ON "site_content_opening_hours" USING btree ("_order");
  CREATE INDEX "site_content_opening_hours_parent_id_idx" ON "site_content_opening_hours" USING btree ("_parent_id");
  CREATE INDEX "site_content_social_links_order_idx" ON "site_content_social_links" USING btree ("_order");
  CREATE INDEX "site_content_social_links_parent_id_idx" ON "site_content_social_links" USING btree ("_parent_id");
  CREATE INDEX "site_content_hero_image_idx" ON "site_content" USING btree ("hero_image_id");
  CREATE INDEX "site_content_hero_video_idx" ON "site_content" USING btree ("hero_video_id");
  CREATE INDEX "site_content_updated_at_idx" ON "site_content" USING btree ("updated_at");
  CREATE INDEX "site_content_created_at_idx" ON "site_content" USING btree ("created_at");
  CREATE UNIQUE INDEX "site_content_locales_locale_parent_id_unique" ON "site_content_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "videos_updated_at_idx" ON "videos" USING btree ("updated_at");
  CREATE INDEX "videos_created_at_idx" ON "videos" USING btree ("created_at");
  CREATE UNIQUE INDEX "videos_filename_idx" ON "videos" USING btree ("filename");
  CREATE INDEX "promotions_image_idx" ON "promotions" USING btree ("image_id");
  CREATE INDEX "promotions_updated_at_idx" ON "promotions" USING btree ("updated_at");
  CREATE INDEX "promotions_created_at_idx" ON "promotions" USING btree ("created_at");
  CREATE UNIQUE INDEX "promotions_locales_locale_parent_id_unique" ON "promotions_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_menu_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_categories_id");
  CREATE INDEX "payload_locked_documents_rels_menu_items_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_items_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_sections_id_idx" ON "payload_locked_documents_rels" USING btree ("sections_id");
  CREATE INDEX "payload_locked_documents_rels_tables_id_idx" ON "payload_locked_documents_rels" USING btree ("tables_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_reservations_id_idx" ON "payload_locked_documents_rels" USING btree ("reservations_id");
  CREATE INDEX "payload_locked_documents_rels_contact_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_messages_id");
  CREATE INDEX "payload_locked_documents_rels_admins_id_idx" ON "payload_locked_documents_rels" USING btree ("admins_id");
  CREATE INDEX "payload_locked_documents_rels_restaurants_id_idx" ON "payload_locked_documents_rels" USING btree ("restaurants_id");
  CREATE INDEX "payload_locked_documents_rels_site_content_id_idx" ON "payload_locked_documents_rels" USING btree ("site_content_id");
  CREATE INDEX "payload_locked_documents_rels_videos_id_idx" ON "payload_locked_documents_rels" USING btree ("videos_id");
  CREATE INDEX "payload_locked_documents_rels_promotions_id_idx" ON "payload_locked_documents_rels" USING btree ("promotions_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_admins_id_idx" ON "payload_preferences_rels" USING btree ("admins_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "menu_categories" CASCADE;
  DROP TABLE "menu_categories_locales" CASCADE;
  DROP TABLE "menu_items" CASCADE;
  DROP TABLE "menu_items_locales" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "sections" CASCADE;
  DROP TABLE "tables" CASCADE;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "reservations" CASCADE;
  DROP TABLE "contact_messages" CASCADE;
  DROP TABLE "admins_sessions" CASCADE;
  DROP TABLE "admins" CASCADE;
  DROP TABLE "restaurants" CASCADE;
  DROP TABLE "site_content_opening_hours" CASCADE;
  DROP TABLE "site_content_social_links" CASCADE;
  DROP TABLE "site_content" CASCADE;
  DROP TABLE "site_content_locales" CASCADE;
  DROP TABLE "videos" CASCADE;
  DROP TABLE "promotions" CASCADE;
  DROP TABLE "promotions_locales" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_menu_categories_restaurant";
  DROP TYPE "public"."enum_menu_items_restaurant";
  DROP TYPE "public"."enum_media_restaurant";
  DROP TYPE "public"."enum_sections_restaurant";
  DROP TYPE "public"."enum_tables_restaurant";
  DROP TYPE "public"."enum_tables_shape";
  DROP TYPE "public"."enum_orders_restaurant";
  DROP TYPE "public"."enum_orders_type";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_orders_payment_method";
  DROP TYPE "public"."enum_reservations_restaurant";
  DROP TYPE "public"."enum_reservations_type";
  DROP TYPE "public"."enum_reservations_status";
  DROP TYPE "public"."enum_contact_messages_restaurant";
  DROP TYPE "public"."enum_admins_restaurant";
  DROP TYPE "public"."enum_restaurants_slug";
  DROP TYPE "public"."enum_restaurants_type";
  DROP TYPE "public"."enum_site_content_opening_hours_day";
  DROP TYPE "public"."enum_site_content_social_links_platform";
  DROP TYPE "public"."enum_site_content_restaurant";
  DROP TYPE "public"."enum_videos_restaurant";
  DROP TYPE "public"."enum_promotions_restaurant";`)
}
