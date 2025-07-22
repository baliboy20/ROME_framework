#!/usr/bin/env python3
"""
ROME Permission Validation Script

Validates that robot permission files are correctly formatted and include required permissions.
"""

import json
import os
import sys
from pathlib import Path

def validate_json_file(filepath):
    """Validate that file contains valid JSON."""
    try:
        with open(filepath, 'r') as f:
            json.load(f)
        return True, None
    except json.JSONDecodeError as e:
        return False, f"Invalid JSON: {e}"
    except FileNotFoundError:
        return False, "File not found"
    except Exception as e:
        return False, f"Error reading file: {e}"

def check_required_permissions(permissions):
    """Check that essential ROME permissions are present."""
    required_allow = [
        "Read(*)",
        "LS(*)", 
        "Glob(*)",
        "Grep(*)",
        "Task(*)"
    ]
    
    required_patterns = [
        "Write(**/SOURCE/**)",
        "Write(**/PROJECT/dev/**)",
        "Edit(**/SOURCE/**)",
        "Edit(**/PROJECT/dev/**)"
    ]
    
    allow_list = permissions.get("allow", [])
    
    missing = []
    
    # Check core tools
    for required in required_allow:
        if required not in allow_list:
            missing.append(required)
    
    # Check file access patterns
    for pattern in required_patterns:
        if not any(pattern in perm for perm in allow_list):
            missing.append(pattern)
    
    return missing

def check_dangerous_permissions(permissions):
    """Check for dangerous permissions that should be denied."""
    dangerous = [
        "Bash(sudo:*)",
        "Bash(rm -rf /*)",
        "Write(/etc/**)",
        "Write(/usr/**)",
        "Write(/var/**)"
    ]
    
    allow_list = permissions.get("allow", [])
    deny_list = permissions.get("deny", [])
    
    issues = []
    
    for danger in dangerous:
        if danger in allow_list and danger not in deny_list:
            issues.append(f"Dangerous permission allowed: {danger}")
    
    return issues

def validate_robot_permissions(robot_dir):
    """Validate permissions for a specific robot directory."""
    settings_file = Path(robot_dir) / ".claude" / "settings.local.json"
    
    print(f"\n=== Validating {robot_dir} ===")
    
    # Check if file exists
    if not settings_file.exists():
        print(f"❌ Missing: {settings_file}")
        return False
    
    # Validate JSON
    is_valid, error = validate_json_file(settings_file)
    if not is_valid:
        print(f"❌ JSON Error: {error}")
        return False
    
    print(f"✅ Valid JSON: {settings_file}")
    
    # Load and validate permissions
    with open(settings_file, 'r') as f:
        data = json.load(f)
    
    if "permissions" not in data:
        print("❌ Missing 'permissions' section")
        return False
    
    permissions = data["permissions"]
    
    # Check required permissions
    missing = check_required_permissions(permissions)
    if missing:
        print("⚠️  Missing required permissions:")
        for perm in missing:
            print(f"   - {perm}")
    else:
        print("✅ All required permissions present")
    
    # Check dangerous permissions
    dangers = check_dangerous_permissions(permissions)
    if dangers:
        print("⚠️  Security concerns:")
        for danger in dangers:
            print(f"   - {danger}")
    else:
        print("✅ No dangerous permissions detected")
    
    # Count permissions
    allow_count = len(permissions.get("allow", []))
    deny_count = len(permissions.get("deny", []))
    print(f"📊 Permissions: {allow_count} allowed, {deny_count} denied")
    
    return len(missing) == 0 and len(dangers) == 0

def main():
    """Main validation function."""
    print("🤖 ROME Permission Validator")
    print("=" * 40)
    
    # Check main settings file
    main_settings = Path(".claude/settings.local.json")
    if main_settings.exists():
        print(f"\n=== Main Settings ===")
        is_valid, error = validate_json_file(main_settings)
        if is_valid:
            print(f"✅ Valid: {main_settings}")
        else:
            print(f"❌ Invalid: {error}")
    
    # Find all robot directories
    robot_dirs = []
    for item in Path(".").iterdir():
        if item.is_dir() and item.name.startswith("claude_"):
            robot_dirs.append(item.name)
    
    if not robot_dirs:
        print("\n⚠️  No robot directories found (claude_*)")
        print("Expected directories: claude_backend, claude_frontend, etc.")
        return False
    
    print(f"\n🔍 Found {len(robot_dirs)} robot directories")
    
    # Validate each robot
    all_valid = True
    for robot_dir in sorted(robot_dirs):
        if not validate_robot_permissions(robot_dir):
            all_valid = False
    
    # Summary
    print("\n" + "=" * 40)
    if all_valid:
        print("🎉 All validations passed!")
        print("\n🚀 Your robots should have proper permissions to:")
        print("   - Read/write source code")
        print("   - Update project tracking")
        print("   - Run development tools")
        print("   - Execute ROME protocols")
    else:
        print("❌ Some validation issues found")
        print("\n🔧 To fix issues:")
        print("   1. Copy permission templates from templates/")
        print("   2. Check JSON syntax with online validator")
        print("   3. Review PERMISSIONS_SETUP_GUIDE.md")
    
    return all_valid

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)