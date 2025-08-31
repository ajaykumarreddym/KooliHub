// Debug test to check if product_area_pricing table exists
import { supabase } from "./client/lib/supabase.js";

async function testAreaProductsTable() {
  console.log("Testing product_area_pricing table...");

  try {
    // Try to query the table
    const { data, error } = await supabase
      .from("product_area_pricing")
      .select("id")
      .limit(1);

    if (error) {
      console.error("❌ Error querying product_area_pricing table:", error);
      console.log("📋 Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      if (error.code === "42P01") {
        console.log(
          "🚨 TABLE MISSING: The 'product_area_pricing' table does not exist!",
        );
        console.log(
          "📝 Solution: Execute the SQL script from 'database-product-area-pricing.sql' in your Supabase dashboard",
        );
      }
    } else {
      console.log("✅ product_area_pricing table exists and is accessible");
      console.log("📊 Sample data:", data);
    }
  } catch (err) {
    console.error("💥 Unexpected error:", err);
  }

  // Also test serviceable_areas table
  try {
    const { data, error } = await supabase
      .from("serviceable_areas")
      .select("id, city")
      .limit(3);

    if (error) {
      console.error("❌ Error querying serviceable_areas:", error);
    } else {
      console.log(
        "✅ serviceable_areas table exists with",
        data?.length || 0,
        "sample records",
      );
      console.log("📊 Sample areas:", data);
    }
  } catch (err) {
    console.error("💥 Error testing serviceable_areas:", err);
  }
}

testAreaProductsTable();
