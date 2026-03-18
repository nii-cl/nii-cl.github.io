---
layout: page
permalink: /seminars/
title: seminars
description: Lab seminar and reading group history.
nav: false
---

<!-- _pages/seminars.md -->
<!-- TODO: render entries from _data/seminars.yml -->

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
