# Validates that each member file's `position` field matches one of the
# valid values defined in the `positions` list in _pages/people.md.
# Raises a build error if an invalid value is found.

Jekyll::Hooks.register :site, :post_read do |site|
  people_page = site.pages.find { |p| p.url == "/people/" }

  unless people_page
    Jekyll.logger.warn "validate_member_positions:", "_pages/people.md not found; skipping position validation."
    next
  end

  valid_positions = people_page.data["positions"]

  unless valid_positions.is_a?(Array) && valid_positions.any?
    Jekyll.logger.warn "validate_member_positions:", "`positions` list not found in people.md front matter; skipping validation."
    next
  end

  errors = []

  site.collections["members"]&.docs&.each do |member|
    position = member.data["position"]
    unless valid_positions.include?(position)
      errors << "  #{member.relative_path}: position \"#{position}\" is not in the allowed list.\n" \
                "    Valid values: #{valid_positions.join(", ")}"
    end
  end

  unless errors.empty?
    raise Jekyll::Errors::FatalException,
          "Invalid member position(s) found:\n#{errors.join("\n")}\n\n" \
          "Update the `positions` list in _pages/people.md to add new values,\n" \
          "or fix the position field in the member file."
  end
end
