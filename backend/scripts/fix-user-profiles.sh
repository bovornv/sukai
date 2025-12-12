#!/bin/bash
# Helper script to fix user_profiles table
# This displays the SQL that needs to be run in Supabase SQL Editor

echo "=========================================="
echo "Fix user_profiles Table"
echo "=========================================="
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/uuuqpiaclmleclsylfqh/sql/new"
echo "2. Copy the SQL below and paste into SQL Editor"
echo "3. Click 'Run' or press Cmd+Enter"
echo ""
echo "=========================================="
echo ""

cat ../database/fix-user-profiles.sql

echo ""
echo "=========================================="
echo "After running, verify with:"
echo "  npm run verify:db"
echo "=========================================="

