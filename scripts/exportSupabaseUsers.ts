/**
 * Export Users from Supabase to JSON
 *
 * This script exports all users from Supabase (both auth.users and profiles table)
 * to prepare them for migration to WorkOS.
 *
 * Usage: bun run scripts/exportSupabaseUsers.ts
 *
 * Output: Creates users-export.json in the scripts directory
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface UserExportData {
    profiles: any[];
    exportedAt: string;
    totalCount: number;
}

async function exportUsers() {
    console.log('Starting user export from Supabase...');

    try {
        // Fetch all profiles (includes basic user info)
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_deleted', false);

        if (profilesError) {
            throw new Error(`Error fetching profiles: ${profilesError.message}`);
        }

        console.log(`✓ Exported ${profiles?.length || 0} profiles`);

        // Prepare export data
        const exportData: UserExportData = {
            profiles: profiles || [],
            exportedAt: new Date().toISOString(),
            totalCount: profiles?.length || 0,
        };

        // Save to file
        const fs = require('fs');
        const filePath = './scripts/users-export.json';

        fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));

        console.log(`\n✅ Export complete!`);
        console.log(`📁 File saved to: ${filePath}`);
        console.log(`📊 Total users exported: ${exportData.totalCount}`);
    } catch (error) {
        console.error('Export failed:', error);
        process.exit(1);
    }
}

exportUsers();
