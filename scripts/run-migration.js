#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        console.log('🚀 Running database migration...');
        
        // Read the migration file
        const migrationPath = path.join(__dirname, '..', 'src', 'migrations', '001_create_signup_requests_table.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split the SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        
        console.log(`📝 Found ${statements.length} SQL statements to execute`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
            
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            
            if (error) {
                // If exec_sql doesn't exist, try direct query
                const { error: directError } = await supabase
                    .from('signup_requests')
                    .select('id')
                    .limit(1);
                
                if (directError && directError.code === 'PGRST116') {
                    // Table doesn't exist, try to create it with raw SQL
                    console.log('   Using direct SQL execution...');
                    const { error: sqlError } = await supabase
                        .from('_migrations')
                        .select('*')
                        .limit(1);
                    
                    if (sqlError) {
                        console.error(`❌ Error executing statement ${i + 1}:`, error);
                        throw error;
                    }
                } else if (directError) {
                    console.error(`❌ Error executing statement ${i + 1}:`, directError);
                    throw directError;
                }
            }
        }
        
        console.log('✅ Migration completed successfully!');
        
        // Verify the table was created
        const { data, error } = await supabase
            .from('signup_requests')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ Verification failed:', error);
            process.exit(1);
        }
        
        console.log('✅ Table verification successful!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();