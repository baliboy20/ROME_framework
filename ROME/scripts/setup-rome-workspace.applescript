-- ROME v5.0 Workspace Setup Script
-- Creates project structure, robot directories, and iTerm workspace with split panes

on run argv
	-- Get base directory from argument (passed by shell script)
	if (count of argv) > 0 then
		set baseDir to item 1 of argv
	else
		-- Fallback: use current working directory
		set baseDir to do shell script "pwd"
	end if

	-- Prompt user for project directory path
	set projectName to text returned of (display dialog "Enter full directory path:" default answer "MyProject")

	-- Create project directory structure
	set projectDir to baseDir & "/" & projectName
	do shell script "mkdir -p " & quoted form of projectDir & "/requirements"
	do shell script "mkdir -p " & quoted form of projectDir & "/dev"
	do shell script "mkdir -p " & quoted form of projectDir & "/design"
	do shell script "mkdir -p " & quoted form of projectDir & "/user_docs"

	-- Create symlink Project -> projectName
	do shell script "cd " & quoted form of baseDir & " && rm -f Project && ln -s " & quoted form of projectName & " Project"

	-- Create all robot directories using create-robot.sh
	set robotNames to {"talib", "pma", "sarah", "clara", "ashok", "reena", "charlie"}
	repeat with robotName in robotNames
		do shell script "cd " & quoted form of baseDir & " && ./ROME/scripts/create-robot.sh " & robotName
	end repeat

	-- Robot configuration: name, directory, badge emoji
	set robotConfigs to {¬
		{robotName:"TALIB", robotDir:"robot_talib", badge:"📋"}, ¬
		{robotName:"PMA", robotDir:"robot_pma", badge:"🏗️"}, ¬
		{robotName:"SARAH", robotDir:"robot_sarah", badge:"✅"}, ¬
		{robotName:"CLARA", robotDir:"robot_clara", badge:"🎨"}, ¬
		{robotName:"ASHOK", robotDir:"robot_ashok", badge:"🗄️"}, ¬
		{robotName:"REENA", robotDir:"robot_reena", badge:"⚙️"}, ¬
		{robotName:"CHARLIE", robotDir:"robot_charlie", badge:"🖥️"}}

	-- Launch iTerm and create split pane layout
	tell application "iTerm"
		activate

		-- Create new window
		set newWindow to (create window with default profile)

		-- Get the initial session (will become TALIB)
		set talibSession to current session of newWindow
		tell talibSession
			set name to "TALIB"
			write text "cd " & quoted form of (baseDir & "/robot_talib") & " && clear"
			write text "export PS1='\\\\W > '"
		end tell

		delay 0.5

		-- Split TALIB vertically to create PMA (top-middle)
		tell talibSession
			set pmaSession to (split vertically with default profile)
		end tell
		tell pmaSession
			set name to "PMA"
			write text "cd " & quoted form of (baseDir & "/robot_pma") & " && clear"
			write text "export PS1='\\\\W > '"
		end tell

		delay 0.5

		-- Split PMA vertically to create SARAH (top-right)
		tell pmaSession
			set sarahSession to (split vertically with default profile)
		end tell
		tell sarahSession
			set name to "SARAH"
			write text "cd " & quoted form of (baseDir & "/robot_sarah") & " && clear"
			write text "export PS1='\\\\W > '"
		end tell

		delay 0.5

		-- NOW SPLIT HORIZONTALLY FROM TALIB to create middle row
		-- Split TALIB horizontally to create CLARA (middle-left)
		tell talibSession
			set claraSession to (split horizontally with default profile)
		end tell
		tell claraSession
			set name to "CLARA"
			write text "cd " & quoted form of (baseDir & "/robot_clara") & " && clear"
			write text "export PS1='\\\\W > '"
		end tell

		delay 0.5

		-- Split PMA horizontally to align with CLARA row and create middle-middle position
		tell pmaSession
			set ashokSession to (split horizontally with default profile)
		end tell
		tell ashokSession
			set name to "ASHOK"
			write text "cd " & quoted form of (baseDir & "/robot_ashok") & " && clear"
			write text "export PS1='\\\\W > '"
		end tell

		delay 0.5

		-- Split SARAH horizontally to align with CLARA/ASHOK row and create middle-right position
		tell sarahSession
			set reenaSession to (split horizontally with default profile)
		end tell
		tell reenaSession
			set name to "REENA"
			write text "cd " & quoted form of (baseDir & "/robot_reena") & " && clear"
			write text "export PS1='\\\\W > '"
		end tell

		delay 0.5

		-- Split CLARA horizontally to create CHARLIE (bottom row)
		tell claraSession
			set charlieSession to (split horizontally with default profile)
		end tell
		tell charlieSession
			set name to "CHARLIE"
			write text "cd " & quoted form of (baseDir & "/robot_charlie") & " && clear"
			write text "export PS1='\\\\W > '"
		end tell

		delay 0.5

		-- Set badges for all sessions (iTerm badges require manual configuration or profiles)
		-- Note: Badges must be enabled in iTerm Preferences -> Profiles -> General -> Badge
		tell talibSession
			write text "printf '\\e]1337;SetBadgeFormat=%s\\a' $(echo -n '📋 TALIB' | base64)"
		end tell

		tell pmaSession
			write text "printf '\\e]1337;SetBadgeFormat=%s\\a' $(echo -n '🏗️ PMA' | base64)"
		end tell

		tell sarahSession
			write text "printf '\\e]1337;SetBadgeFormat=%s\\a' $(echo -n '✅ SARAH' | base64)"
		end tell

		tell claraSession
			write text "printf '\\e]1337;SetBadgeFormat=%s\\a' $(echo -n '🎨 CLARA' | base64)"
		end tell

		tell ashokSession
			write text "printf '\\e]1337;SetBadgeFormat=%s\\a' $(echo -n '🗄️ ASHOK' | base64)"
		end tell

		tell reenaSession
			write text "printf '\\e]1337;SetBadgeFormat=%s\\a' $(echo -n '⚙️ REENA' | base64)"
		end tell

		tell charlieSession
			write text "printf '\\e]1337;SetBadgeFormat=%s\\a' $(echo -n '🖥️ CHARLIE' | base64)"
		end tell

	end tell

	-- Show completion message
	display dialog "ROME workspace ready!

Project: " & projectName & "
Symlink: Project -> " & projectName & "

iTerm layout:
┌─────────────────────────────────┐
│ TALIB  │  PMA   │ SARAH │
├─────────────────────────────────┤
│ CLARA  │ ASHOK  │  REENA    │
├─────────────────────────────────┤
│        CHARLIE                  │
└─────────────────────────────────┘

Ready to start with Phase 1 (Talib)!" buttons {"OK"} default button "OK"

end run
