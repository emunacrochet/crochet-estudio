import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dbxggubrvuncwogzjvoi.supabase.co";

const supabaseKey = "sb_publishable_GLRiPxUsJrzhGvHhah0-jQ_B7ix-bWK";

export const supabase = createClient(supabaseUrl, supabaseKey);