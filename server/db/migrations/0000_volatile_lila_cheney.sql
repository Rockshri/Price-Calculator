CREATE TABLE IF NOT EXISTS "calculation_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer,
	"calculated_at" timestamp with time zone DEFAULT now(),
	"fulfillment_type" varchar(20) DEFAULT 'easy_ship',
	"gst_rate" numeric(5, 4) DEFAULT '0.05',
	"return_rate" numeric(5, 4) DEFAULT '0.15',
	"avg_storage_days" integer DEFAULT 45,
	"storage_rate_per_day" numeric(8, 4) DEFAULT '0.30',
	"marketing_rate" numeric(5, 4) DEFAULT '0.20',
	"best_listing_price" numeric(10, 2),
	"best_selling_price" numeric(10, 2),
	"seller_side_costs" numeric(10, 2),
	"fulfilment_cost" numeric(10, 2),
	"amazon_charges" numeric(10, 2),
	"return_charges" numeric(10, 2),
	"net_profit" numeric(10, 2),
	"margin_pct" numeric(8, 6),
	"profit_on_cost_pct" numeric(8, 6),
	"all_scenarios" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "calculator_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "calculator_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"main_category" varchar(50) NOT NULL,
	"category_name" varchar(255) NOT NULL,
	CONSTRAINT "categories_category_name_unique" UNIQUE("category_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "closing_fees" (
	"id" serial PRIMARY KEY NOT NULL,
	"min_price" numeric(12, 2),
	"max_price" numeric(12, 2),
	"easy_ship" numeric(8, 2),
	"self_ship" numeric(8, 2),
	"seller_flex" numeric(8, 2)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"sr_no" integer,
	"product_name" varchar(255) NOT NULL,
	"category_id" integer,
	"weight_gm" numeric(8, 2),
	"length_cm" numeric(8, 2),
	"width_cm" numeric(8, 2),
	"height_cm" numeric(8, 2),
	"manufacturing_cost" numeric(10, 2),
	"image_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "referral_fees" (
	"id" serial PRIMARY KEY NOT NULL,
	"main_category" varchar(50),
	"category_name" varchar(255),
	"min_price" numeric(12, 2) DEFAULT '0',
	"max_price" numeric(12, 2),
	"rate" numeric(6, 4)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shipping_costs" (
	"id" serial PRIMARY KEY NOT NULL,
	"min_weight_kg" numeric(6, 3),
	"max_weight_kg" numeric(6, 3),
	"rate" numeric(8, 2)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "calculation_results" ADD CONSTRAINT "calculation_results_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
