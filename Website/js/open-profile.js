// Petlife — /profile/<slug> fallback (audit PL-262, 2026-10-18). Turns the path into the app's own link.
//
// The app's share sheet sends https://petlifeindia.co/profile/<slug>. With the app installed and Android
// App Links verified, Android opens the app before this page loads. Otherwise this page offers the app
// link by hand. Nothing about the profile is fetched or shown here.
//
// The slug is CHECKED before it goes anywhere: lowercase letters, digits and hyphens (what the app's slugs
// are made of), or a uuid. Anything else gets the "link isn't complete" note and a button that goes home,
// so a crafted path cannot be turned into some other link on this page.
(function () {
  var match = /^\/profile\/([^/?#]+)\/?$/.exec(window.location.pathname)
  var slug = ''
  // A malformed %-escape makes decodeURIComponent throw; that path is just an invalid link.
  try { slug = match ? decodeURIComponent(match[1]) : '' } catch (e) { slug = '' }
  var ok = /^[a-z0-9][a-z0-9-]{0,80}$/i.test(slug)
  var button = document.getElementById('openProfileApp')
  if (ok && button) {
    button.setAttribute('href', 'petlife://profile/' + encodeURIComponent(slug))
    return
  }
  var intro = document.getElementById('openProfileIntro')
  var invalid = document.getElementById('openProfileInvalid')
  if (intro) intro.hidden = true
  if (invalid) invalid.hidden = false
  if (button) button.textContent = 'Go to Petlife'
})()
