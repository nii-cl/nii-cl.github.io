---
layout: page
permalink: /people/
title: People
nav_title: people
nav: true
nav_order: 1
---

<!-- _pages/people.md -->
<!-- Member data is managed in _members/*.md files. -->

<h2>Faculty</h2>
{% assign faculty = site.members | where: "role", "faculty" %}
{% for member in faculty %}
  {% include member_info.liquid member=member %}
{% endfor %}

<h2>Researchers</h2>
{% assign researchers = site.members | where: "role", "researcher" %}
{% for member in researchers %}
  {% include member_info.liquid member=member %}
{% endfor %}

<h2>Students <span class="section-note">(Graduate University for Advanced Studies; SOKENDAI)</span></h2>
{% assign students = site.members | where: "role", "students" %}
{% for member in students %}
  {% include member_info.liquid member=member %}
{% endfor %}
<h2>Research Assistants</h2>
{% assign research_assistants = site.members | where: "role", "research_assistant" %}
{% for member in research_assistants %}
  {% include member_info.liquid member=member %}
{% endfor %}
<h2>Interns</h2>
{% assign interns = site.members | where: "role", "intern" %}
{% for member in interns %}
  {% include member_info.liquid member=member %}
{% endfor %}
<h2>Collaborators</h2>
{% assign collaborators = site.members | where: "role", "collaborator" %}
{% for member in collaborators %}
  {% include member_info.liquid member=member %}
{% endfor %}
<h2>Administrative Staff</h2>
{% assign administrative_staff = site.members | where: "role", "administrative_staff" %}
{% for member in administrative_staff %}
  {% include member_info.liquid member=member %}
{% endfor %}

