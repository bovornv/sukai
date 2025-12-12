#!/bin/bash
# Helper script to display SQL files for easy copy-paste

echo "=========================================="
echo "Step 1: Run Schema SQL"
echo "=========================================="
echo ""
cat schema.sql
echo ""
echo ""
echo "=========================================="
echo "Step 2: Run RLS Policies SQL"
echo "=========================================="
echo ""
cat rls_policies.sql
echo ""
echo ""
echo "Instructions:"
echo "1. Go to: https://supabase.com/dashboard/project/uuuqpiaclmleclsylfqh/sql"
echo "2. Copy the SQL above (Step 1) and paste into SQL Editor"
echo "3. Click 'Run' or press Cmd+Enter"
echo "4. Copy the SQL above (Step 2) and paste into SQL Editor"
echo "5. Click 'Run' or press Cmd+Enter"
echo ""

