$(document).ready(function () {
  // add toggle functionality to abstract, award and bibtex buttons
  $("a.abstract").click(function () {
    $(this).parent().parent().find(".abstract.hidden").toggleClass("open");
    $(this).parent().parent().find(".award.hidden.open").toggleClass("open");
    $(this).parent().parent().find(".bibtex.hidden.open").toggleClass("open");
  });
  $("a.award").click(function () {
    $(this).parent().parent().find(".abstract.hidden.open").toggleClass("open");
    $(this).parent().parent().find(".award.hidden").toggleClass("open");
    $(this).parent().parent().find(".bibtex.hidden.open").toggleClass("open");
  });
  $("a.bibtex").click(function () {
    $(this).parent().parent().find(".abstract.hidden.open").toggleClass("open");
    $(this).parent().parent().find(".award.hidden.open").toggleClass("open");
    $(this).parent().parent().find(".bibtex.hidden").toggleClass("open");
  });
  $("a").removeClass("waves-effect waves-light");

  // bootstrap-toc
  if ($("#toc-sidebar").length) {
    // remove related publications years from the TOC
    $(".publications h2").each(function () {
      $(this).attr("data-toc-skip", "");
    });
    var navSelector = "#toc-sidebar";
    var $myNav = $(navSelector);
    Toc.init($myNav);
    $("body").scrollspy({
      target: navSelector,
      offset: 100,
    });
  }

  // add css to jupyter notebooks
  const cssLink = document.createElement("link");
  cssLink.href = "../css/jupyter.css";
  cssLink.rel = "stylesheet";
  cssLink.type = "text/css";

  let jupyterTheme = determineComputedTheme();

  $(".jupyter-notebook-iframe-container iframe").each(function () {
    $(this).contents().find("head").append(cssLink);

    if (jupyterTheme == "dark") {
      $(this).bind("load", function () {
        $(this).contents().find("body").attr({
          "data-jp-theme-light": "false",
          "data-jp-theme-name": "JupyterLab Dark",
        });
      });
    }
  });

  // trigger popovers
  $('[data-toggle="popover"]').popover({
    trigger: "hover",
  });

  const $siteNav = $("#site-nav");

  if ($siteNav.length) {
    const $btn = $siteNav.find(".greedy-nav__toggle");
    const $vlinks = $siteNav.find(".visible-links");
    const $hlinks = $siteNav.find(".hidden-links");
    const breakWidths = [];
    let rafId = null;

    const getAvailableSpace = () => {
      const buttonWidth = $btn.hasClass("hidden") ? 0 : $btn.outerWidth(true);
      return $siteNav.innerWidth() - buttonWidth - 1;
    };

    const getVisibleWidth = () => {
      const visibleLinks = $vlinks.get(0);
      return visibleLinks ? visibleLinks.scrollWidth : 0;
    };

    const closeHiddenLinks = () => {
      $hlinks.addClass("hidden");
      $btn.attr("aria-expanded", "false");
    };

    const updateNav = () => {
      const availableSpace = getAvailableSpace();

      if (getVisibleWidth() > availableSpace && $vlinks.children().length > 0) {
        breakWidths.push(getVisibleWidth());
        $vlinks.children().last().detach().prependTo($hlinks);
        $btn.removeClass("hidden");
        updateNav();
      } else if (breakWidths.length > 0 && availableSpace > breakWidths[breakWidths.length - 1]) {
        $hlinks.children().first().detach().appendTo($vlinks);
        breakWidths.pop();
        updateNav();
      }

      if ($hlinks.children().length > 0) {
        $btn.removeClass("hidden");
      } else {
        $btn.addClass("hidden");
        closeHiddenLinks();
      }
    };

    const scheduleUpdateNav = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updateNav);
    };

    $btn.on("click", function () {
      const willOpen = $hlinks.hasClass("hidden");
      $hlinks.toggleClass("hidden");
      $(this).attr("aria-expanded", willOpen ? "true" : "false");
    });

    $hlinks.on("click", "a", function () {
      closeHiddenLinks();
    });

    $(document).on("click", function (event) {
      if (!$siteNav.is(event.target) && $siteNav.has(event.target).length === 0) {
        closeHiddenLinks();
      }
    });

    $(window).on("resize", function () {
      closeHiddenLinks();
      scheduleUpdateNav();
    });

    $(window).on("load", scheduleUpdateNav);
    scheduleUpdateNav();
  }
});
