---
layout: page
permalink: /people/
title: People
description: Members of the NII Computational Linguistics Lab.
nav: true
nav_order: 1
positions:
  - Principal Investigator
  - Researchers
  - Graduate Students
  - Research Collaborators
---

<!-- _pages/people.md -->
<!-- Member data is managed in _members/*.md files.        -->
<!-- Position categories and their order are defined above -->
<!-- in the `positions` front matter list.                 -->

{% for position in page.positions %}
  {% assign members_in_position = site.members | where: "position", position %}
  {% if members_in_position.size > 0 %}

## {{ position }}

{% for member in members_in_position %}
{% include member_info.liquid member=member %}
{% endfor %}
  {% endif %}
{% endfor %}
