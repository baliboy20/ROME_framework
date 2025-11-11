-- ROME v6.0 iTerm Workspace Launcher
-- Launches iTerm with split panes for existing robot directories
-- NOTE: Assumes robots already exist (created via create-robot.sh)

on run argv
	-- Get base directory from argument (passed by shell script)
	if (count of argv) > 0 then
		set baseDir to item 1 of argv
	else
		-- Fallback: use current working directory
		set baseDir to do shell script "pwd"
	end if

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
			write text "export PS1='\\W > '"
		end tell

		delay 0.5

		-- Split TALIB vertically to create PMA
		tell talibSession
			set pmaSession to (split vertically with default profile)
		end tell
		tell pmaSession
			set name to "PMA"
			write text "cd " & quoted form of (baseDir & "/robot_pma") & " && clear"
			write text "export PS1='\\W > '"
		end tell

		delay 0.5

		-- Split PMA vertically to create SARAH
		tell pmaSession
			set sarahSession to (split vertically with default profile)
		end tell
		tell sarahSession
			set name to "SARAH"
			write text "cd " & quoted form of (baseDir & "/robot_sarah") & " && clear"
			write text "export PS1='\\W > '"
		end tell

		delay 0.5

		-- Split SARAH vertically to create ROMA
		tell sarahSession
			set romaSession to (split vertically with default profile)
		end tell
		tell romaSession
			set name to "ROMA"
			write text "cd " & quoted form of (baseDir & "/robot_roma") & " && clear"
			write text "export PS1='\\W > '"
		end tell

		delay 0.5

		-- Split TALIB horizontally to create CLARA (bottom row)
		tell talibSession
			set claraSession to (split horizontally with default profile)
		end tell
		tell claraSession
			set name to "CLARA"
			write text "cd " & quoted form of (baseDir & "/robot_clara") & " && clear"
			write text "export PS1='\\W > '"
		end tell

		delay 0.5

		-- Split PMA horizontally to create ASHOK
		tell pmaSession
			set ashokSession to (split horizontally with default profile)
		end tell
		tell ashokSession
			set name to "ASHOK"
			write text "cd " & quoted form of (baseDir & "/robot_ashok") & " && clear"
			write text "export PS1='\\W > '"
		end tell

		delay 0.5

		-- Split SARAH horizontally to create REENA
		tell sarahSession
			set reenaSession to (split horizontally with default profile)
		end tell
		tell reenaSession
			set name to "REENA"
			write text "cd " & quoted form of (baseDir & "/robot_reena") & " && clear"
			write text "export PS1='\\W > '"
		end tell

		delay 0.5

		-- Split ROMA horizontally to create CHARLIE
		tell romaSession
			set charlieSession to (split horizontally with default profile)
		end tell
		tell charlieSession
			set name to "CHARLIE"
			write text "cd " & quoted form of (baseDir & "/robot_charlie") & " && clear"
			write text "export PS1='\\W > '"
		end tell

		delay 0.5

		-- Set badges for all sessions
		tell talibSession
			write text "printf '\\e]1337;SetBadgeFormat=%s\\a' $(echo -n '📋 TALIB' | base64)"
		end tell

		tell pmaSession
			write text "printf '\\e]1337;SetBadgeFormat=%s\\a' $(echo -n '🏗️ PMA' | base64)"
		end tell

		tell sarahSession
			write text "printf '\\e]1337;SetBadgeFormat=%s\\a' $(echo -n '✅ SARAH' | base64)"
		end tell

		tell romaSession
			write text "printf '\\e]1337;SetBadgeFormat=%s\\a' $(echo -n '🎯 ROMA' | base64)"
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
	display dialog "ROME iTerm workspace ready!

Layout:
┌─────────────────────────────────────────────────┐
│  📋 TALIB  │ 🏗️ PMA  │ ✅ SARAH  │ 🎯 ROMA  │
├─────────────────────────────────────────────────┤
│  🎨 CLARA  │ 🗄️ ASHOK │ ⚙️ REENA  │ 🖥️ CHARLIE │
└─────────────────────────────────────────────────┘

Ready to start!" buttons {"OK"} default button "OK"

end run
