---
layout: page
permalink: /people/
title: People
description: Members of the NII Computational Linguistics Lab.
nav: true
nav_order: 1
---

<!-- _pages/people.md -->
<!-- Member data is managed in _members/*.md files. -->

{% for member in site.members %}
  {% include member_info.liquid member=member %}
{% endfor %}
