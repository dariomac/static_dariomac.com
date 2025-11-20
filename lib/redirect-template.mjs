/**
 * HTML template for the redirect page with analytics tracking
 * This page loads GA, fires a pageview event, then redirects to the destination
 */

export function generateRedirectPage(destinationUrl, slug, ogTags = {}) {
  // Generate Open Graph meta tags
  const ogMetaTags = generateOGMetaTags(ogTags, destinationUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(ogTags['og:title'] || 'Redirecting...')}</title>

  <!-- Open Graph tags for social media preview -->
${ogMetaTags}

  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-NBDFJZDVV3"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-NBDFJZDVV3');
  </script>

  <!-- PostHog Analytics -->
  <script>
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('phc_Ip4X0TpkPZOdNVhcXCAvn8IyeT7qymmjRMs0BURjKmm',{api_host:'https://us.i.posthog.com', person_profiles: 'always'});
  </script>

  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top: 4px solid white;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 300;
      margin: 0;
    }
    p {
      font-size: 0.9rem;
      opacity: 0.8;
      margin-top: 0.5rem;
    }
    a {
      color: white;
      text-decoration: underline;
    }
  </style>

  <!-- Meta refresh as fallback if JavaScript is disabled -->
  <meta http-equiv="refresh" content="2;url=${escapeHtml(destinationUrl)}">
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Redirecting...</h1>
    <p>If you're not redirected, <a href="${escapeHtml(destinationUrl)}" id="manual-link">click here</a></p>
  </div>

  <script>
    // Destination URL
    const destination = ${JSON.stringify(destinationUrl)};

    // Track the redirect event in Google Analytics
    gtag('event', 'page_view', {
      page_path: '/go/${escapeJs(slug)}',
      page_title: 'Go Link Redirect',
      destination_url: destination
    });

    // Track with PostHog
    posthog.capture('go_link_redirect', {
      destination_url: destination,
      slug: ${JSON.stringify(slug.substring(0, 20))}
    });

    // Wait for analytics to fire, then redirect
    // Use beacon API as backup to ensure event is sent even if page unloads quickly
    if (navigator.sendBeacon) {
      // Beacon is sent even if page navigates away immediately
      setTimeout(() => {
        window.location.href = destination;
      }, 100); // Short delay to allow analytics to initialize
    } else {
      // Fallback for older browsers - wait a bit longer
      setTimeout(() => {
        window.location.href = destination;
      }, 500);
    }

    // Also make the manual link track before redirecting
    document.getElementById('manual-link').addEventListener('click', function(e) {
      gtag('event', 'manual_redirect_click', {
        destination_url: destination
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Escape JavaScript string (for use in inline scripts)
 */
function escapeJs(text) {
  return text.replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

/**
 * Generate Open Graph meta tags HTML
 * @param {Object} ogTags - Object with OG tag key-value pairs
 * @param {string} destinationUrl - Fallback URL if og:url not present
 * @returns {string} HTML meta tags
 */
function generateOGMetaTags(ogTags, destinationUrl) {
  const tags = [];

  // Ensure we have at least og:url
  if (!ogTags['og:url']) {
    ogTags['og:url'] = destinationUrl;
  }

  // Add all OG tags
  for (const [property, content] of Object.entries(ogTags)) {
    if (content) {
      const escapedContent = escapeHtml(content);

      // Twitter uses 'name' instead of 'property'
      if (property.startsWith('twitter:')) {
        tags.push(`  <meta name="${property}" content="${escapedContent}">`);
      } else if (property === 'description') {
        tags.push(`  <meta name="description" content="${escapedContent}">`);
      } else {
        tags.push(`  <meta property="${property}" content="${escapedContent}">`);
      }
    }
  }

  // Add canonical link
  tags.push(`  <link rel="canonical" href="${escapeHtml(destinationUrl)}">`);

  return tags.join('\n');
}
