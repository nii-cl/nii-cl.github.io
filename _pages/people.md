---
layout: page
permalink: /people/
title: people
description: Members of the NII Computational Linguistics Lab.
nav: true
nav_order: 1
---

<!-- _pages/people.md -->
<!-- Member data is managed in _members/*.md files. -->

{% assign positions = "Principal Investigator,Researchers,Graduate Students,Research Assistants,Interns,Collaborators,Administrative Staff" | split: "," %}

{% for pos in positions %}
  {% assign members_in_pos = site.members | where: "position", pos %}
  {% if members_in_pos.size > 0 %}

## {{ pos }}

    {% for member in members_in_pos %}
      {% include member_info.liquid member=member %}
    {% endfor %}

  {% endif %}
{% endfor %}
