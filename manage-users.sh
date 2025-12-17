#!/bin/bash

# Helper script to manage Supabase users
# Usage: ./manage-users.sh [command] [email]

DB_CONTAINER="supabase-db-1"
DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"

case "$1" in
  list)
    echo "📋 Listing all users..."
    docker exec -it $DB_CONTAINER psql -U postgres -d postgres -c \
      "SELECT email, created_at, email_confirmed_at,
       raw_user_meta_data->>'name' as name,
       raw_user_meta_data->>'is_admin' as is_admin
       FROM auth.users ORDER BY created_at DESC;"
    ;;

  make-admin)
    if [ -z "$2" ]; then
      echo "❌ Error: Email required"
      echo "Usage: ./manage-users.sh make-admin user@example.com"
      exit 1
    fi
    echo "🔑 Making $2 an admin..."
    docker exec -it $DB_CONTAINER psql -U postgres -d postgres -c \
      "UPDATE auth.users
       SET raw_user_meta_data = raw_user_meta_data || '{\"is_admin\": true}'::jsonb
       WHERE email = '$2';"
    echo "✅ Done! User should sign out and sign back in."
    ;;

  remove-admin)
    if [ -z "$2" ]; then
      echo "❌ Error: Email required"
      echo "Usage: ./manage-users.sh remove-admin user@example.com"
      exit 1
    fi
    echo "⬇️  Removing admin from $2..."
    docker exec -it $DB_CONTAINER psql -U postgres -d postgres -c \
      "UPDATE auth.users
       SET raw_user_meta_data = raw_user_meta_data - 'is_admin'
       WHERE email = '$2';"
    echo "✅ Done! User should sign out and sign back in."
    ;;

  delete)
    if [ -z "$2" ]; then
      echo "❌ Error: Email required"
      echo "Usage: ./manage-users.sh delete user@example.com"
      exit 1
    fi
    echo "⚠️  WARNING: This will permanently delete user: $2"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
      docker exec -it $DB_CONTAINER psql -U postgres -d postgres -c \
        "DELETE FROM auth.users WHERE email = '$2';"
      echo "✅ User deleted"
    else
      echo "❌ Cancelled"
    fi
    ;;

  *)
    echo "Supabase User Management Script"
    echo "================================"
    echo ""
    echo "Usage: ./manage-users.sh [command] [email]"
    echo ""
    echo "Commands:"
    echo "  list                    List all users"
    echo "  make-admin <email>      Grant admin privileges"
    echo "  remove-admin <email>    Remove admin privileges"
    echo "  delete <email>          Delete a user"
    echo ""
    echo "Examples:"
    echo "  ./manage-users.sh list"
    echo "  ./manage-users.sh make-admin chris@example.com"
    echo "  ./manage-users.sh remove-admin chris@example.com"
    ;;
esac
