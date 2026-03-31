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

<section class="people-section">
  <h4>Faculty</h4>
  {% assign faculty = site.members | where: "role", "faculty" %}
  {% for member in faculty %}
    {% include member_info.liquid member=member %}
  {% endfor %}
</section>

<section class="people-section">
  <h4>Researchers</h4>
  {% assign researchers = site.members | where: "role", "researcher" %}
  {% for member in researchers %}
    {% include member_info.liquid member=member %}
  {% endfor %}
</section>

<section class="people-section">
  <h4>Graduate Students</h4>
  {% assign students = site.members | where: "role", "students" %}
  {% for member in students %}
    {% include member_info.liquid member=member %}
  {% endfor %}
</section>

<section class="people-section">
  <h4>Research Assistants</h4>
  {% assign research_assistants = site.members | where: "role", "research_assistant" %}
  {% for member in research_assistants %}
    {% include member_info.liquid member=member %}
  {% endfor %}
</section>

<section class="people-section">
  <h4>Interns</h4>
  {% assign interns = site.members | where: "role", "intern" %}
  {% for member in interns %}
    {% include member_info.liquid member=member %}
  {% endfor %}
</section>

<section class="people-section">
  <h4>Collaborators</h4>
  {% assign collaborators = site.members | where: "role", "collaborator" %}
  {% for member in collaborators %}
    {% include member_info.liquid member=member %}
  {% endfor %}
</section>

<section class="people-section">
  <h4>Administrative Staff</h4>
  {% assign administrative_staff = site.members | where: "role", "administrative_staff" %}
  {% for member in administrative_staff %}
    {% include member_info.liquid member=member %}
  {% endfor %}
</section>
