---
layout: page
permalink: /seminars/
title: Seminars
nav_title: seminars
description: Lab seminar and reading group history.
nav: true
nav_order: 4
_styles: >
  table { width: 100%; border-collapse: collapse; }
  table th, table td { border: 1px solid #000; padding: 0.5rem 0.75rem; }
---

<!-- _pages/seminars.md -->
<!-- TODO: render entries from _data/seminars.yml -->

This seminar provides a forum for group members and invited guests to present and discuss ongoing research, including work in progress and recent findings.

{% if site.data.seminars %}

<table>
  <thead>
    <tr>
      <th>Date</th>
      <th>Presenter</th>
      <th>Title</th>
      <th>Slides</th>
    </tr>
  </thead>
  <tbody>
    {% assign seminars = site.data.seminars | sort: "date" | reverse %}
    {% for s in seminars %}
    <tr>
      <td>{{ s.date }}</td>
      <td>{{ s.presenter }}</td>
      <td>{{ s.title }}</td>
      <td>{% if s.slides_url %}<a href="{{ s.slides_url }}">slides</a>{% endif %}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>
{% endif %}
