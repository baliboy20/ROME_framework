import 'package:flutter/material.dart';
import '../theme/tokens.dart';

class NavLeaf {
  final String code;
  final String label;
  final String route;
  const NavLeaf(this.code, this.label, this.route);
}

class NavGroup {
  final String title;
  final List<NavLeaf> leaves;
  /// Accent dot beside the group title (mockup groups are hue-coded).
  final Color hue;
  const NavGroup(this.title, this.leaves, {this.hue = FobColors.textFaint});
}

/// TreeNav — collapsible grouped tree nav; collapses to a 68px icon rail.
/// Collapse/expand state is a client-only transient (UXD-18).
class TreeNav extends StatefulWidget {
  final List<NavGroup> groups;
  final String activeRoute;
  final void Function(String route) onSelect;

  const TreeNav({super.key, required this.groups, required this.activeRoute, required this.onSelect});

  @override
  State<TreeNav> createState() => _TreeNavState();
}

class _TreeNavState extends State<TreeNav> {
  bool collapsed = false;
  // Groups start fully collapsed; the owner expands what they need (UXD-18).
  final Set<String> openGroups = {};

  bool get _allExpanded => openGroups.length == widget.groups.length;

  void _toggleAll() {
    setState(() {
      if (_allExpanded) {
        openGroups.clear();
      } else {
        openGroups.addAll(widget.groups.map((g) => g.title));
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 160),
      width: collapsed ? 68 : 240,
      color: FobColors.surfaceRail,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 12, 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!collapsed)
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Friends on Bikes',
                            style: TextStyle(
                                fontFamily: FobText.sans,
                                letterSpacing: -0.2,
                                fontSize: 18,
                                height: 1.1,
                                fontWeight: FontWeight.w600,
                                color: FobColors.textStrong)),
                        const SizedBox(height: 2),
                        Text('BACK OFFICE', style: FobText.microLabel),
                      ],
                    ),
                  ),
                _RailToggle(
                  collapsed: collapsed,
                  onTap: () => setState(() => collapsed = !collapsed),
                ),
              ],
            ),
          ),
          if (!collapsed)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 12, 4),
              child: InkWell(
                key: const Key('nav-expand-all-toggle'),
                borderRadius: BorderRadius.circular(8),
                onTap: _toggleAll,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                  child: Row(
                    children: [
                      Icon(_allExpanded ? Icons.unfold_less : Icons.unfold_more,
                          size: 13, color: FobColors.textFaint),
                      const SizedBox(width: 8),
                      Text(_allExpanded ? 'COLLAPSE ALL' : 'EXPAND ALL',
                          style: FobText.microLabel),
                    ],
                  ),
                ),
              ),
            ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              children: widget.groups.map((g) => _buildGroup(g)).toList(),
            ),
          ),
          if (!collapsed)
            Container(
              margin: const EdgeInsets.fromLTRB(16, 8, 16, 18),
              padding: const EdgeInsets.only(top: 16),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: FobColors.hairlineWarm)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    alignment: Alignment.center,
                    decoration: const BoxDecoration(
                        gradient: FobColors.gradientBrand, shape: BoxShape.circle),
                    child: const Text('W',
                        style: TextStyle(
                            fontFamily: FobText.sans,
                            fontWeight: FontWeight.w700,
                            color: Colors.white)),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('William',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: FobColors.textStrong)),
                      Text('Owner', style: TextStyle(fontSize: 11, color: FobColors.textMuted)),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildGroup(NavGroup g) {
    final open = openGroups.contains(g.title);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (!collapsed)
          InkWell(
            onTap: () => setState(() => open ? openGroups.remove(g.title) : openGroups.add(g.title)),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(color: g.hue, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 8),
                  Expanded(child: Text(g.title.toUpperCase(), style: FobText.microLabel)),
                  Icon(open ? Icons.expand_more : Icons.chevron_right, size: 13, color: FobColors.textFaint),
                ],
              ),
            ),
          ),
        if (collapsed || open)
          ...g.leaves.map((leaf) {
            final active = widget.activeRoute == leaf.route;
            final item = InkWell(
              borderRadius: BorderRadius.circular(10),
              onTap: () => widget.onSelect(leaf.route),
              child: Container(
                margin: const EdgeInsets.only(bottom: 2, left: 4, right: 4),
                decoration: BoxDecoration(
                  // Active item = pale-pink tint (mockup), not grey.
                  color: active ? FobHue.pink.background : null,
                  borderRadius: BorderRadius.circular(10),
                ),
                padding: EdgeInsets.symmetric(horizontal: collapsed ? 0 : 12, vertical: 8),
                child: collapsed
                    ? Center(
                        child: Text(leaf.code,
                            style: TextStyle(
                                fontFamily: FobText.mono,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: active ? FobColors.pink : FobColors.textMuted)))
                    : Row(
                        children: [
                          Text(leaf.code,
                              style: TextStyle(
                                  fontFamily: FobText.mono,
                                  fontSize: 10,
                                  color: active ? FobColors.pink : FobColors.textFaint)),
                          const SizedBox(width: 8),
                          Text(leaf.label,
                              style: TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                                  color: active ? FobColors.pinkText : FobColors.textBody)),
                        ],
                      ),
              ),
            );
            // Tooltip only in the collapsed icon-rail (label hidden). When
            // expanded the label is visible, so no redundant tooltip.
            return collapsed ? Tooltip(message: leaf.label, child: item) : item;
          }),
      ],
    );
  }
}

/// Small square rail collapse/expand toggle (.rail-toggle).
class _RailToggle extends StatelessWidget {
  final bool collapsed;
  final VoidCallback onTap;
  const _RailToggle({required this.collapsed, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      key: const Key('nav-collapse-toggle'),
      borderRadius: BorderRadius.circular(8),
      onTap: onTap,
      child: Container(
        width: 26,
        height: 26,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: FobColors.surfaceBgLo,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: FobColors.hairlineWarm),
        ),
        child: Icon(collapsed ? Icons.chevron_right : Icons.chevron_left,
            size: 16, color: FobColors.textMuted),
      ),
    );
  }
}
