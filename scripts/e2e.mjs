// Browser checks: screenshots (desktop/phone x light/dark x fr/en), the tab
// bar and hash routing of the one-page app, and scripted interaction in the
// weathering tab and the rock key. Fails on any console error or warning, and on horizontal
// overflow.
//
//   npm i            (installs playwright, dev only)
//   npx playwright install chromium   (once, if no browser is cached)
//   python3 -m http.server 9427 --directory site &
//   BASE=http://localhost:9427 node scripts/e2e.mjs
//
// Screenshots go to $SHOTS (default /tmp/geo-shots).

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:9427';
const SHOTS = process.env.SHOTS || '/tmp/geo-shots';
mkdirSync(SHOTS, { recursive: true });

const devices = {
  desktop: { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const browser = await chromium.launch();
const problems = [];
let checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) problems.push(msg); };

async function newPage(device, scheme, lang) {
  const ctx = await browser.newContext({ ...devices[device], colorScheme: scheme, locale: lang === 'fr' ? 'fr-FR' : 'en-GB' });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(`[${device} ${scheme} ${lang}] console ${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`[${device} ${scheme} ${lang}] page error: ${e.message}`));
  return { ctx, page };
}
const settle = (page) => page.waitForTimeout(250);
const hero = (page) => page.textContent('#w-result');
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

// ---------------------------------------------------------------- screenshots
for (const device of Object.keys(devices)) {
  for (const scheme of ['light', 'dark']) {
    for (const lang of ['en', 'fr']) {
      const { ctx, page } = await newPage(device, scheme, lang);
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
      await settle(page);
      ok((await page.getAttribute('html', 'lang')) === lang, `start: browser language ${lang} not picked up`);
      ok((await page.textContent('[role="tab"][aria-selected="true"]')) === (lang === 'fr' ? 'Altération des silicates' : 'Silicate weathering'), `start ${lang}: tab label`);
      ok(new URL(page.url()).hash === '#/weathering', `start: route ${page.url()}`);
      await page.screenshot({ path: `${SHOTS}/top-${device}-${scheme}-${lang}.png` });
      for (const [name, q] of [['weathering', ''], ['albite', '?m=albite&xi=-2.6'], ['quartz', '?m=quartz'], ['forsterite', '?m=forsterite&xi=-3&sys=Mg'], ['water', '?mode=water&sys=Na&cmp=rh']]) {
        await page.goto(`${BASE}/#/weathering${q}`, { waitUntil: 'networkidle' });
        await settle(page);
        ok((await page.getAttribute('html', 'lang')) === lang, `${name}: language ${lang}`);
        await page.screenshot({ path: `${SHOTS}/${name}-${device}-${scheme}-${lang}.png`, fullPage: true });
        const o = await overflow(page);
        ok(o <= 0, `${name} ${device}: horizontal overflow ${o}px`);
      }
      await ctx.close();
    }
  }
}

// ---------------------------------------------------------------- tab bar and routing (desktop)
{
  const { ctx, page } = await newPage('desktop', 'light', 'en');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await settle(page);
  const tabs = page.locator('[role="tablist"] [role="tab"]');
  ok((await tabs.count()) === 2, `two tabs, got ${await tabs.count()}`);
  ok((await page.getAttribute('[role="tablist"]', 'aria-label')) === 'Tools', 'tablist label');
  const tab = tabs.first();
  ok((await tab.getAttribute('aria-selected')) === 'true' && (await tab.getAttribute('tabindex')) === '0', 'tab selected and in the tab order');
  const panelId = await tab.getAttribute('aria-controls');
  ok((await page.getAttribute(`#${panelId}`, 'role')) === 'tabpanel', 'aria-controls points to the panel');
  ok((await page.getAttribute(`#${panelId}`, 'aria-labelledby')) === (await tab.getAttribute('id')), 'panel labelled by its tab');
  ok(await page.isVisible(`#${panelId} #w-result`), 'weathering inside its panel');
  ok((await page.title()) === 'Silicate weathering · outils-geo', `title: ${await page.title()}`);
  ok((await page.$$eval('a[href]', (as) => as.filter((a) => !/^(#|https?:)/.test(a.getAttribute('href'))).length)) === 0, 'no links to other pages of the site (one page)');
  // Keyboard: from the language/theme buttons, Tab reaches the selected tab;
  // arrows, Home and End move between the tabs and show them (automatic
  // activation); Tab moves on into the panel.
  await page.focus('[data-theme-btn]');
  await page.keyboard.press('Tab');
  ok(await tab.evaluate((el) => el === document.activeElement), 'Tab reaches the tab bar');
  for (const [key, id] of [['ArrowRight', 'rocks'], ['ArrowLeft', 'weathering'], ['End', 'rocks'], ['Home', 'weathering'], ['ArrowLeft', 'rocks'], ['ArrowRight', 'weathering']]) {
    await page.keyboard.press(key);
    await settle(page);
    ok(await page.evaluate((t) => document.activeElement.id === `tab-${t}` && document.activeElement.getAttribute('aria-selected') === 'true', id), `${key} selects ${id}`);
    ok(new URL(page.url()).hash === `#/${id}`, `${key}: route ${page.url()}`);
    ok(await page.isVisible(`#panel-${id}`), `${key}: panel ${id} shown`);
  }
  await page.keyboard.press('Tab');
  ok(await page.evaluate((id) => document.activeElement.id === id, panelId), 'Tab moves into the panel');
  // Unknown or empty routes fall back to the tab; the URL is rewritten.
  await page.goto(`${BASE}/#/indices?x=1`, { waitUntil: 'networkidle' });
  await settle(page);
  ok(new URL(page.url()).hash === '#/weathering', `unknown tab rewritten: ${page.url()}`);
  ok((await hero(page)).trim() === 'kaolinite', 'unknown tab shows weathering');
  // State in the URL; back and forward restore it.
  await page.goto(`${BASE}/#/weathering?m=quartz`, { waitUntil: 'networkidle' });
  await settle(page);
  await page.goto(`${BASE}/#/weathering?m=albite&xi=-2.6`, { waitUntil: 'networkidle' });
  await settle(page);
  ok((await page.inputValue('#w-mineral')) === 'albite', 'route sets the mineral');
  await page.goBack();
  await settle(page);
  ok((await page.inputValue('#w-mineral')) === 'quartz', `back restores the state: ${page.url()}`);
  await page.goForward();
  await settle(page);
  ok((await page.inputValue('#w-mineral')) === 'albite' && /smectite/i.test(await hero(page)), 'forward restores the state');
  // A citation scrolls to its source and keeps the route.
  const before = page.url();
  const link = page.locator('.regime a.src').first();
  const target = (await link.getAttribute('href')).slice(1);
  await link.click();
  const shown = await page.waitForFunction((id) => { const el = document.getElementById(id); const r = el.getBoundingClientRect(); return el.classList.contains('is-target') && r.top >= 0 && r.bottom <= innerHeight; }, target, { timeout: 3000 }).then(() => true, () => false);
  ok(page.url() === before, `citation keeps the route: ${page.url()}`);
  ok(shown, `citation shows ${target}`);
  ok((await page.$$('.sources li')).length >= 10, 'sources at the bottom of the tab');
  // An anchor opened directly (new browser tab) also works.
  await page.goto(`${BASE}/#w-src-feth`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  ok(new URL(page.url()).hash.startsWith('#/weathering'), `anchor URL rewritten to a route: ${page.url()}`);
  ok(await page.evaluate(() => document.getElementById('w-src-feth').classList.contains('is-target')), 'anchor URL marks its source');
  // The brand goes back to the start of the tool.
  await page.goto(`${BASE}/#/weathering?m=albite`, { waitUntil: 'networkidle' });
  await page.click('.brand');
  await settle(page);
  ok(new URL(page.url()).hash === '#/weathering' && (await page.inputValue('#w-mineral')) === 'K-feldspar', `brand resets: ${page.url()}`);
  // No tracking: every request stays on this site.
  const hosts = new Set();
  page.on('request', (r) => hosts.add(new URL(r.url()).host));
  await page.reload({ waitUntil: 'networkidle' });
  ok([...hosts].every((h) => h === new URL(BASE).host), `requests only to the site: ${[...hosts]}`);
  ok(await page.evaluate(() => document.cookie === ''), 'no cookies');
  await ctx.close();
}

// ---------------------------------------------------------------- interaction (desktop)
{
  const { ctx, page } = await newPage('desktop', 'light', 'en');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await settle(page);
  ok((await hero(page)).trim() === 'kaolinite', `default: ${await hero(page)}`);
  ok(/monosiallitisation/.test(await page.textContent('.regime')), 'default regime');

  // Intense leaching: gibbsite. Keyboard on the slider.
  await page.focus('#w-xi');
  await page.keyboard.press('Home');
  await settle(page);
  ok((await hero(page)).trim() === 'gibbsite', `xi min: ${await hero(page)}`);
  ok(/allitisation/.test(await page.textContent('.regime')), 'gibbsite regime');
  // Stagnant water: the feldspar reaches equilibrium.
  await page.keyboard.press('End');
  await settle(page);
  ok(/equilibrium with K-feldspar/.test(await page.textContent('.sub')), 'xi max: equilibrium');
  ok(new URL(page.url()).hash.includes('xi=-1'), `hash keeps state: ${page.url()}`);

  // The highlighted step matches the result.
  await page.focus('#w-xi');
  await page.keyboard.press('Home');
  await settle(page);
  const current = await page.$$eval('#w-steps .wstep.is-current h3', (els) => els.map((e) => e.textContent));
  ok(current.length >= 1 && current.every((t) => /gibbsite/.test(t)), `current steps: ${current}`);

  // Every reaction of every mineral balances (no ✗ in the balance tables).
  const ids = await page.$$eval('#w-mineral option', (os) => os.map((o) => o.value));
  ok(ids.length === 12, `12 minerals, got ${ids.length}`);
  for (const id of ids) {
    await page.selectOption('#w-mineral', id);
    await settle(page);
    const bad = await page.$$eval('table.bal td.error', (t) => t.length);
    const good = await page.$$eval('table.bal td.ok', (t) => t.length);
    ok(bad === 0 && good > 0, `${id}: balance ${good} ok, ${bad} bad`);
    ok((await hero(page)).trim().length > 0, `${id}: a result`);
  }
  await page.selectOption('#w-mineral', 'albite');
  await page.evaluate(() => { const r = document.getElementById('w-xi'); r.value = '-2.6'; r.dispatchEvent(new Event('input')); });
  await settle(page);
  ok(/smectite/i.test(await hero(page)), `albite, slow drainage: ${await hero(page)}`);
  ok(/bisiallitisation/.test(await page.textContent('.regime')), 'albite regime');
  ok((await page.getAttribute('#w-diagram svg', 'aria-label')).includes('Na system'), 'albite shows the Na diagram');
  await page.screenshot({ path: `${SHOTS}/interact-1-albite.png`, fullPage: false });

  // Quartz: dissolution only, quartz card.
  await page.selectOption('#w-mineral', 'quartz');
  await settle(page);
  ok(await page.isVisible('#w-quartz'), 'quartz card visible');
  ok(/kaolinite needs aluminium/.test(await page.textContent('#w-quartz')), 'quartz note');
  ok(/Dissolves slowly|Saturated/.test(await hero(page)), `quartz hero: ${await hero(page)}`);
  const q25 = await page.evaluate(() => { const r = document.getElementById('w-temp'); r.value = '25'; r.dispatchEvent(new Event('input')); return true; });
  void q25;
  await settle(page);
  ok(/6 mg\/L|6\.0 mg\/L/.test(await page.textContent('#w-quartz')), 'quartz 6 mg/L at 25 °C');

  // A measured water, presets, diagram systems, comparison, hover.
  await page.selectOption('#w-mineral', 'K-feldspar');
  await page.check('input[name="w-mode"][value="water"]');
  await page.click('#w-preset-per');
  await settle(page);
  ok((await hero(page)).trim() === 'kaolinite', `perennial springs: ${await hero(page)}`);
  ok((await page.inputValue('#w-ca')) === '10.4', 'preset fills the fields');
  await page.fill('#w-sio2', '1');
  await settle(page);
  ok((await hero(page)).trim() === 'gibbsite', `little silica: ${await hero(page)}`);
  await page.fill('#w-sio2', 'abc');
  ok((await page.getAttribute('#w-sio2', 'aria-invalid')) === 'true', 'invalid input flagged');
  await page.fill('#w-sio2', '24,6');
  await settle(page);
  await page.click('#w-sys button[data-sys="Ca"]');
  ok((await page.getAttribute('#w-diagram svg', 'aria-label')).includes('Ca system'), 'system switch');
  await page.selectOption('#w-cmp', 'rh');
  ok(await page.$$eval('#w-diagram .ad-cmp', (l) => l.length) > 0, 'comparison lines drawn');
  ok(/Robie/.test(await page.textContent('.legend')), 'comparison in the legend');
  const box = await page.locator('#w-diagram svg').boundingBox();
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.6);
  ok(await page.isVisible('.ad-tip'), 'hover read-out');
  ok(/gibbsite|kaolinite/.test(await page.textContent('.ad-tip')), `hover text: ${await page.textContent('.ad-tip')}`);
  await page.click('#w-unc summary');
  ok(await page.$$eval('#w-unc tbody tr', (r) => r.length) >= 3, 'uncertainty table');
  await page.screenshot({ path: `${SHOTS}/interact-2-water-ca.png`, fullPage: true });

  // Kinetics reacts to time.
  const before = await page.textContent('#w-frac');
  await page.fill('#w-yr', '1000000');
  ok((await page.textContent('#w-frac')) !== before, 'time changes the dissolved fraction');

  // Hash restores a state; language and theme toggles.
  await page.goto(`${BASE}/#/weathering?m=forsterite&xi=-3`, { waitUntil: 'networkidle' });
  ok((await page.inputValue('#w-mineral')) === 'forsterite', 'hash restores the mineral');
  ok(/Dissolves completely/.test(await hero(page)), `forsterite: ${await hero(page)}`);
  await page.click('[data-lang-btn="fr"]');
  ok((await page.textContent('h1')) === 'L’altération des silicates', 'language toggle');
  ok((await page.textContent('[role="tab"]')) === 'Altération des silicates' && (await page.title()) === 'Altération des silicates · outils-geo', 'tab and title in French');
  ok((await page.getAttribute('[role="tablist"]', 'aria-label')) === 'Outils', 'tablist label in French');
  ok(new URL(page.url()).hash === '#/weathering?m=forsterite&xi=-3', `language keeps the route: ${page.url()}`);
  ok(/Se dissout entièrement/.test(await hero(page)), 'result in French');
  await page.click('[data-theme-btn]');
  ok((await page.getAttribute('html', 'data-theme')) === 'dark', 'theme toggle');
  await page.screenshot({ path: `${SHOTS}/interact-3-fr-dark.png` });
  await ctx.close();
}

// ---------------------------------------------------------------- rock key
{
  const { ctx, page } = await newPage('desktop', 'light', 'en');
  const stage = '#rk-stage';
  const question = () => page.textContent(`${stage} h2`);
  const answer = async (id) => { await page.click(`${stage} button[data-answer="${id}"]`); await settle(page); };
  await page.goto(`${BASE}/#/rocks`, { waitUntil: 'networkidle' });
  await settle(page);
  ok((await page.title()) === 'Rock key · outils-geo', `rocks title: ${await page.title()}`);
  ok(/loose or coherent/.test(await question()), `first question: ${await question()}`);
  ok(await page.isDisabled('#rk-back'), 'back disabled at the start');
  // Walk: granite.
  for (const a of ['coherent', 'none', 'crystals', 'mix', 'light', 'yes']) await answer(a);
  ok((await page.textContent(`${stage} .rk-result-name`)) === 'Granite (granitic rock)', `granite path: ${await page.textContent(`${stage} h2`)}`);
  ok(new URL(page.url()).hash === '#/rocks?p=coherent.none.crystals.mix.light.yes', `route of the path: ${page.url()}`);
  ok((await page.$$(`${stage} .rk-crumbs li`)).length === 6, 'six steps in the path');
  ok(await page.evaluate(() => document.activeElement.classList.contains('rk-focus')), 'focus moves to the new heading');
  await page.screenshot({ path: `${SHOTS}/rocks-granite.png`, fullPage: false });
  // Back, then another branch: syenite.
  await page.click('#rk-back');
  await settle(page);
  ok(/quartz/i.test(await question()), 'back returns to the quartz question');
  await answer('no');
  ok((await page.textContent(`${stage} .rk-result-name`)) === 'Syenite', 'syenite after back');
  // A crumb jumps back to its question.
  await page.click(`${stage} .rk-crumbs li:nth-child(2) a`);
  await settle(page);
  ok(/fizz/i.test(await question()), `crumb 2 goes to the acid question: ${await question()}`);
  ok(new URL(page.url()).hash === '#/rocks?p=coherent', `crumb route: ${page.url()}`);
  // Chalk, marl, slate, shale, eclogite, pumice, flint.
  const walks = [
    [['fizz', 'fine', 'chalk'], 'Chalk'],
    [['fizz', 'fine', 'marl'], 'Marl'],
    [['none', 'foliated', 'plates', 'slate'], 'Slate'],
    [['none', 'foliated', 'plates', 'shale'], 'Shale'],
    [['none', 'foliated', 'flakes', 'green'], 'Greenschist or blueschist (metamorphosed basalt)'],
    [['none', 'crystals', 'garnet'], 'Eclogite'],
    [['none', 'glass', 'pumice'], 'Pumice'],
    [['none', 'fine', 'hard', 'flint'], 'Flint, chert'],
  ];
  for (const [p, name] of walks) {
    await page.click('#rk-restart');
    await settle(page);
    await answer('coherent');
    for (const a of p) await answer(a);
    const got = await page.textContent(`${stage} .rk-result-name`);
    ok(got === name, `${p.join('.')}: ${got}`);
  }
  await page.goto(`${BASE}/#/rocks?p=coherent.none.foliated.flakes.green`, { waitUntil: 'networkidle' });
  await settle(page);
  ok(/thin section/.test(await page.textContent(`${stage} .note`)), 'greenschist card warns about thin sections');
  await page.screenshot({ path: `${SHOTS}/rocks-greenschist.png`, fullPage: true });
  // Look-alike link opens the other rock.
  await page.click(`${stage} .rk-like a >> nth=0`);
  await settle(page);
  ok((await page.textContent(`${stage} .rk-result-name`)) === 'Amphibolite', 'look-alike link');
  // Every rock of the index leads to its card, with a photo that loads (or none).
  const links = await page.$$eval('#rk-index a', (as) => as.map((a) => [a.getAttribute('href'), a.textContent]));
  ok(links.length >= 40, `index has ${links.length} rocks`);
  for (const [href, name] of links) {
    await page.goto(`${BASE}/${href}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(80);
    ok((await page.textContent(`${stage} .rk-result-name`)) === name, `index ${name}: ${await page.textContent(`${stage} h2`)}`);
    const img = await page.$(`${stage} .rk-photo img`);
    if (img) {
      await img.scrollIntoViewIfNeeded();
      ok(await img.evaluate((i) => i.complete && i.naturalWidth > 0 || new Promise((r) => { i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); })), `${name}: photo loads`);
      ok(/Wikimedia Commons/.test(await page.textContent(`${stage} figcaption`)), `${name}: photo credit`);
    }
  }
  // Unknown answers are dropped from the route.
  await page.goto(`${BASE}/#/rocks?p=coherent.bogus.none`, { waitUntil: 'networkidle' });
  await settle(page);
  ok(new URL(page.url()).hash === '#/rocks?p=coherent', `bad path rewritten: ${page.url()}`);
  // Every test explained has text and every drawing renders.
  ok((await page.$$('#rk-tests .rk-test')).length >= 15, 'tests explained');
  ok((await page.$$('#rk-tests svg')).length >= 10, 'drawings in the tests');
  ok((await page.$$('#rk-sources li')).length >= 30, 'sources listed');
  ok((await page.$$('#rk-credits li')).length >= 40, 'photo credits listed');
  ok((await page.$$('#rk-about .rk-fixes li')).length >= 10, 'fixes of the starting key listed');
  // Language keeps the path.
  await page.goto(`${BASE}/#/rocks?p=coherent.fizz.fine.marl`, { waitUntil: 'networkidle' });
  await page.click('[data-lang-btn="fr"]');
  await settle(page);
  ok((await page.textContent(`${stage} .rk-result-name`)) === 'Marne', 'French result');
  ok((await page.textContent('h1')) === 'Clé de détermination des roches', 'French title');
  ok(new URL(page.url()).hash === '#/rocks?p=coherent.fizz.fine.marl', 'language keeps the path');
  await page.click('[data-theme-btn]');
  await page.screenshot({ path: `${SHOTS}/rocks-marl-fr-dark.png`, fullPage: true });
  await page.click('[data-lang-btn="en"]');
  await ctx.close();
}
{
  const { ctx, page } = await newPage('phone', 'dark', 'fr');
  await page.goto(`${BASE}/#/rocks`, { waitUntil: 'networkidle' });
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/rocks-phone-start.png`, fullPage: true });
  ok((await overflow(page)) <= 0, `rocks phone overflow ${await overflow(page)}`);
  for (const a of ['coherent', 'none', 'grains', 'sand', 'quartz']) { await page.tap(`#rk-stage button[data-answer="${a}"]`); await settle(page); }
  ok((await page.textContent('#rk-stage .rk-result-name')) === 'Grès', 'phone walk to sandstone');
  ok((await overflow(page)) <= 0, 'rocks phone overflow on a result');
  await page.screenshot({ path: `${SHOTS}/rocks-phone-sandstone.png`, fullPage: true });
  await ctx.close();
}

// ---------------------------------------------------------------- phone
{
  const { ctx, page } = await newPage('phone', 'light', 'fr');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await settle(page);
  ok((await hero(page)).trim() === 'kaolinite', 'phone result');
  const tb = await page.locator('[role="tab"]').first().boundingBox();
  ok(tb.height >= 44 && tb.x >= 0 && tb.x + tb.width <= 390, `phone tab: ${JSON.stringify(tb)}`);
  await page.locator('[role="tab"]').first().tap();
  ok(new URL(page.url()).hash === '#/weathering', 'tapping the tab keeps the route');
  await page.locator('#w-diagram svg').scrollIntoViewIfNeeded();
  const box = await page.locator('#w-diagram svg').boundingBox();
  await page.touchscreen.tap(box.x + box.width * 0.3, box.y + box.height * 0.5);
  ok(await page.isVisible('.ad-tip'), 'tap read-out on phone');
  ok((await overflow(page)) <= 0, 'phone overflow');
  await page.screenshot({ path: `${SHOTS}/interact-4-phone-tap.png` });
  await ctx.close();
}

await browser.close();
if (problems.length) {
  console.error(`FAILED ${problems.length} of ${checks} checks:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`OK: ${checks} checks, no console errors. Screenshots in ${SHOTS}`);
