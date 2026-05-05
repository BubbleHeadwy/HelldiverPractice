import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const outputDataPath = path.join(rootDir, 'public', 'data', 'stratagems.json')
const iconsDir = path.join(rootDir, 'public', 'assets', 'icons')

const decode = (text) => JSON.parse(`"${text}"`)

const categoryTranslations = {
  'Orbital Strikes': decode('\\u8f68\\u9053\\u653b\\u51fb'),
  'Eagle Strikes': decode('\\u98de\\u9e70\\u653b\\u51fb'),
  'Support Weapons': decode('\\u652f\\u63f4\\u6b66\\u5668'),
  Backpacks: decode('\\u80cc\\u5305'),
  Emplacements: decode('\\u90e8\\u7f72\\u88c5\\u7f6e'),
  Sentries: decode('\\u54e8\\u6212\\u70ae'),
  Vehicles: decode('\\u8f7d\\u5177'),
  Ship: decode('\\u8230\\u8239\\u652f\\u63f4'),
  Objective: decode('\\u4efb\\u52a1\\u76ee\\u6807'),
  Other: decode('\\u5176\\u4ed6'),
}

const categorySortOrder = [
  'Orbital Strikes',
  'Eagle Strikes',
  'Support Weapons',
  'Backpacks',
  'Emplacements',
  'Sentries',
  'Vehicles',
  'Ship',
  'Objective',
  'Other',
]

const t = (value) => decode(value)

const nameTranslations = {
  'MG-43 Machine Gun': t('\\u004d\\u0047\\u002d\\u0034\\u0033\\u0020\\u673a\\u67aa'),
  'EAT-17 Expendable Anti-Tank': t('\\u0045\\u0041\\u0054\\u002d\\u0031\\u0037\\u0020\\u6d88\\u8017\\u6027\\u53cd\\u5766\\u514b\\u6b66\\u5668'),
  'M-105 Stalwart': t('\\u004d\\u002d\\u0031\\u0030\\u0035\\u0020\\u76df\\u53cb'),
  'LAS-98 Laser Cannon': t('\\u004c\\u0041\\u0053\\u002d\\u0039\\u0038\\u0020\\u6fc0\\u5149\\u5927\\u70ae'),
  'APW-1 Anti-Materiel Rifle': t('\\u0041\\u0050\\u0057\\u002d\\u0031\\u0020\\u53cd\\u5668\\u6750\\u6b65\\u67aa'),
  'GL-21 Grenade Launcher': t('\\u0047\\u004c\\u002d\\u0032\\u0031\\u0020\\u69b4\\u5f39\\u53d1\\u5c04\\u5668'),
  'GR-8 Recoilless Rifle': t('\\u0047\\u0052\\u002d\\u0038\\u0020\\u65e0\\u540e\\u5750\\u529b\\u70ae'),
  'FLAM-40 Flamethrower': t('\\u0046\\u004c\\u0041\\u004d\\u002d\\u0034\\u0030\\u0020\\u706b\\u7130\\u55b7\\u5c04\\u5668'),
  'MG-206 Heavy Machine Gun': t('\\u004d\\u0047\\u002d\\u0032\\u0030\\u0036\\u0020\\u91cd\\u673a\\u67aa'),
  'AC-8 Autocannon': t('\\u0041\\u0043\\u002d\\u0038\\u0020\\u673a\\u70ae'),
  'ARC-3 Arc Thrower': t('\\u0041\\u0052\\u0043\\u002d\\u0033\\u0020\\u7535\\u5f27\\u53d1\\u5c04\\u5668'),
  'LAS-99 Quasar Cannon': t('\\u004c\\u0041\\u0053\\u002d\\u0039\\u0039\\u0020\\u7c7b\\u661f\\u4f53\\u52a0\\u519c\\u70ae'),
  'RL-77 Airburst Rocket Launcher': t('\\u0052\\u004c\\u002d\\u0037\\u0037\\u0020\\u7a7a\\u7206\\u706b\\u7bad\\u53d1\\u5c04\\u5668'),
  'MLS-4X Commando': t('\\u004d\\u004c\\u0053\\u002d\\u0034\\u0058\\u0020\\u7a81\\u51fb\\u5175'),
  'FAF-14 Spear': t('\\u0046\\u0041\\u0046\\u002d\\u0031\\u0034\\u0020\\u98de\\u77db'),
  'RS-422 Railgun': t('\\u0052\\u0053\\u002d\\u0034\\u0032\\u0032\\u0020\\u78c1\\u8f68\\u70ae'),
  'StA-X3 W.A.S.P. Launcher': t('\\u0053\\u0074\\u0041\\u002d\\u0058\\u0033\\u0020\\u0057\\u002e\\u0041\\u002e\\u0053\\u002e\\u0050\\u002e\\u0020\\u53d1\\u5c04\\u5668'),
  'CQC-20 Breaching Hammer': t('\\u0043\\u0051\\u0043\\u002d\\u0032\\u0030\\u0020\\u7834\\u62c6\\u9524'),
  'PLAS-45 Epoch': t('\\u0050\\u004c\\u0041\\u0053\\u002d\\u0034\\u0035\\u0020\\u7eaa\\u5143'),
  'MGX-42 Bullet Storm': t('\\u004d\\u0047\\u0058\\u002d\\u0034\\u0032\\u0020\\u5f39\\u96e8'),
  'S-11 Speargun': t('\\u0053\\u002d\\u0031\\u0031\\u0020\\u957f\\u77db\\u67aa'),
  'CQC-9 Defoliation Tool': t('\\u0043\\u0051\\u0043\\u002d\\u0039\\u0020\\u6e05\\u969c\\u5de5\\u5177'),
  'TX-41 Sterilizer': t('\\u0054\\u0058\\u002d\\u0034\\u0031\\u0020\\u706d\\u83cc\\u5668'),
  'EAT-700 Expendable Napalm': t('\\u0045\\u0041\\u0054\\u002d\\u0037\\u0030\\u0030\\u0020\\u6d88\\u8017\\u6027\\u51dd\\u56fa\\u6c7d\\u6cb9\\u5f39'),
  'EAT-411 Leveller': t('\\u0045\\u0041\\u0054\\u002d\\u0034\\u0031\\u0031\\u0020\\u5e73\\u5730\\u673a'),
  'GL-52 De-Escalator': t('\\u0047\\u004c\\u002d\\u0035\\u0032\\u0020\\u964d\\u7ea7\\u5668'),
  'GL-28 Belt-Fed Grenade Launcher': t('\\u0047\\u004c\\u002d\\u0032\\u0038\\u0020\\u4f9b\\u5f39\\u5f0f\\u69b4\\u5f39\\u53d1\\u5c04\\u5668'),
  'B/MD C4 Pack': t('\\u0042\\u002f\\u004d\\u0044\\u0020\\u0043\\u0034\\u0020\\u70b8\\u836f\\u5305'),
  'MS-11 Solo Silo': t('\\u004d\\u0053\\u002d\\u0031\\u0031\\u0020\\u5355\\u5175\\u5bfc\\u5f39\\u4e95'),
  'B/FLAM-80 Cremator': t('\\u0042\\u002f\\u0046\\u004c\\u0041\\u004d\\u002d\\u0038\\u0030\\u0020\\u711a\\u5316\\u5668'),
  'M-1000 Maxigun': t('\\u004d\\u002d\\u0031\\u0030\\u0030\\u0030\\u0020\\u91cd\\u578b\\u673a\\u67aa'),
  'CQC-1 One True Flag': t('\\u0043\\u0051\\u0043\\u002d\\u0031\\u0020\\u771f\\u7406\\u4e4b\\u65d7'),
  'Orbital Precision Strike': t('\\u8f68\\u9053\\u7cbe\\u51c6\\u653b\\u51fb'),
  'Orbital Gatling Barrage': t('\\u8f68\\u9053\\u52a0\\u7279\\u6797\\u706b\\u529b\\u7f51'),
  'Orbital Gas Strike': t('\\u8f68\\u9053\\u6bd2\\u6c14\\u653b\\u51fb'),
  'Orbital 120mm HE Barrage': t('\\u8f68\\u9053\\u0020\\u0031\\u0032\\u0030\\u004d\\u004d\\u0020\\u9ad8\\u7206\\u5f39\\u706b\\u529b\\u7f51'),
  'Orbital Airburst Strike': t('\\u8f68\\u9053\\u7a7a\\u7206\\u653b\\u51fb'),
  'Orbital Smoke Strike': t('\\u8f68\\u9053\\u70df\\u96fe\\u653b\\u51fb'),
  'Orbital EMS Strike': t('\\u8f68\\u9053\\u7535\\u78c1\\u51b2\\u51fb\\u6ce2\\u653b\\u51fb'),
  'Orbital 380mm HE Barrage': t('\\u8f68\\u9053\\u0020\\u0033\\u0038\\u0030\\u004d\\u004d\\u0020\\u9ad8\\u7206\\u5f39\\u706b\\u529b\\u7f51'),
  'Orbital Walking Barrage': t('\\u8f68\\u9053\\u6e38\\u8d70\\u706b\\u529b\\u7f51'),
  'Orbital Laser': t('\\u8f68\\u9053\\u6fc0\\u5149\\u70ae'),
  'Orbital Napalm Barrage': t('\\u8f68\\u9053\\u51dd\\u56fa\\u6c7d\\u6cb9\\u5f39\\u706b\\u529b\\u7f51'),
  'Orbital Railcannon Strike': t('\\u8f68\\u9053\\u70ae\\u653b\\u51fb'),
  'Eagle Strafing Run': t('\\u98de\\u9e70\\u673a\\u67aa\\u626b\\u5c04'),
  'Eagle Airstrike': t('\\u98de\\u9e70\\u7a7a\\u88ad'),
  'Eagle Cluster Bomb': t('\\u98de\\u9e70\\u96c6\\u675f\\u70b8\\u5f39'),
  'Eagle Smoke Strike': t('\\u98de\\u9e70\\u70df\\u96fe\\u653b\\u51fb'),
  'Eagle Napalm Airstrike': t('\\u98de\\u9e70\\u51dd\\u56fa\\u6c7d\\u6cb9\\u5f39\\u7a7a\\u88ad'),
  'Eagle 110mm Rocket Pods': t('\\u98de\\u9e70\\u0020\\u0031\\u0031\\u0030\\u004d\\u004d\\u0020\\u706b\\u7bad\\u5de2'),
  'Eagle 500kg Bomb': t('\\u98de\\u9e70\\u0020\\u0035\\u0030\\u0030\\u004b\\u0047\\u0020\\u70b8\\u5f39'),
  'MD-6 Anti-Personnel Minefield': t('\\u004d\\u0044\\u002d\\u0036\\u0020\\u53cd\\u6b65\\u5175\\u96f7\\u533a'),
  'MD-I4 Incendiary Mines': t('\\u004d\\u0044\\u002d\\u0031\\u0034\\u0020\\u71c3\\u70e7\\u5730\\u96f7'),
  'MD-17 Anti-Tank Mines': t('\\u004d\\u0044\\u002d\\u0031\\u0037\\u0020\\u53cd\\u5766\\u514b\\u5730\\u96f7'),
  'FX-12 Shield Generator Relay': t('\\u0046\\u0058\\u002d\\u0031\\u0032\\u0020\\u9632\\u62a4\\u7f69\\u751f\\u6210\\u4e2d\\u7ee7\\u5668'),
  'E/MG-101 HMG Emplacement': t('\\u0045\\u002f\\u004d\\u0047\\u002d\\u0031\\u0030\\u0031\\u0020\\u91cd\\u673a\\u67aa\\u90e8\\u7f72\\u652f\\u67b6'),
  'E/GL-21 Grenadier Battlement': t('\\u0045\\u002f\\u0047\\u004c\\u002d\\u0032\\u0031\\u0020\\u63b7\\u5f39\\u5175\\u9632\\u536b\\u5899'),
  'MD-8 Gas Mines': t('\\u004d\\u0044\\u002d\\u0038\\u0020\\u6bd2\\u6c14\\u5730\\u96f7'),
  'E/AT-12 Anti-Tank Emplacement': t('\\u0045\\u002f\\u0041\\u0054\\u002d\\u0031\\u0032\\u0020\\u53cd\\u5766\\u514b\\u70ae\\u53f0'),
  'A/MG-43 Machine Gun Sentry': t('\\u0041\\u002f\\u004d\\u0047\\u002d\\u0034\\u0033\\u0020\\u54e8\\u6212\\u673a\\u67aa'),
  'A/G-16 Gatling Sentry': t('\\u0041\\u002f\\u0047\\u002d\\u0031\\u0036\\u0020\\u52a0\\u7279\\u6797\\u54e8\\u6212\\u70ae'),
  'A/AC-8 Autocannon Sentry': t('\\u0041\\u002f\\u0041\\u0043\\u002d\\u0038\\u0020\\u81ea\\u52a8\\u54e8\\u6212\\u70ae'),
  'A/M-12 Mortar Sentry': t('\\u0041\\u002f\\u004d\\u002d\\u0031\\u0032\\u0020\\u8feb\\u51fb\\u54e8\\u6212\\u70ae'),
  'A/MLS-4X Rocket Sentry': t('\\u0041\\u002f\\u004d\\u004c\\u0053\\u002d\\u0034\\u0058\\u0020\\u706b\\u7bad\\u54e8\\u6212\\u70ae'),
  'A/ARC-3 Tesla Tower': t('\\u0041\\u002f\\u0041\\u0052\\u0043\\u002d\\u0033\\u0020\\u7279\\u65af\\u62c9\\u5854'),
  'A/M-23 EMS Mortar Sentry': t('\\u0041\\u002f\\u004d\\u002d\\u0032\\u0033\\u0020\\u7535\\u78c1\\u51b2\\u51fb\\u6ce2\\u8feb\\u51fb\\u54e8\\u6212\\u70ae'),
  'A/LAS-98 Laser Sentry': t('\\u0041\\u002f\\u004c\\u0041\\u0053\\u002d\\u0039\\u0038\\u0020\\u6fc0\\u5149\\u54e8\\u6212\\u70ae'),
  'A/FLAM-40 Flame Sentry': t('\\u0041\\u002f\\u0046\\u004c\\u0041\\u004d\\u002d\\u0034\\u0030\\u0020\\u706b\\u7130\\u55b7\\u5c04\\u54e8\\u6212\\u70ae'),
  'A/GM-17 Gas Mortar Sentry': t('\\u0041\\u002f\\u0047\\u004d\\u002d\\u0031\\u0037\\u0020\\u6bd2\\u6c14\\u8feb\\u51fb\\u54e8\\u6212\\u70ae'),
  'B-1 Supply Pack': t('\\u0042\\u002d\\u0031\\u0020\\u8865\\u7ed9\\u80cc\\u5305'),
  'LIFT-850 Jump Pack': t('\\u004c\\u0049\\u0046\\u0054\\u002d\\u0038\\u0035\\u0030\\u0020\\u55b7\\u5c04\\u80cc\\u5305'),
  'SH-20 Ballistic Shield Backpack': t('\\u0053\\u0048\\u002d\\u0032\\u0030\\u0020\\u9632\\u5f39\\u76fe\\u80cc\\u5305'),
  'AX/AR-23 Guard Dog': t('\\u0041\\u0058\\u002f\\u0041\\u0052\\u002d\\u0032\\u0033\\u0020\\u62a4\\u536b\\u72ac'),
  'AX/LAS-5 Rover': t('\\u0041\\u0058\\u002f\\u004c\\u0041\\u0053\\u002d\\u0035\\u0020\\u62a4\\u536b\\u72ac\\u6f2b\\u6e38\\u8f66'),
  'SH-32 Shield Generator Pack': t('\\u0053\\u0048\\u002d\\u0033\\u0032\\u0020\\u9632\\u62a4\\u7f69\\u751f\\u6210\\u5305'),
  'SH-51 Directional Shield': t('\\u0053\\u0048\\u002d\\u0035\\u0031\\u0020\\u5b9a\\u5411\\u76fe'),
  'AX/FLAM-75 Hot Dog': t('\\u0041\\u0058\\u002f\\u0046\\u004c\\u0041\\u004d\\u002d\\u0037\\u0035\\u0020\\u201c\\u70ed\\u72d7\\u201d'),
  'B-100 Portable Hellbomb': t('\\u0042\\u002d\\u0031\\u0030\\u0030\\u0020\\u4fbf\\u643a\\u5f0f\\u5730\\u72f1\\u706b\\u70b8\\u5f39'),
  'AX/ARC-3 K-9': t('\\u0041\\u0058\\u002f\\u0041\\u0052\\u0043\\u002d\\u0033\\u0020\\u004b\\u002d\\u0039\\u0020\\u201c\\u4e5d\\u53f7\\u201d'),
  'LIFT-860 Hover Pack': t('\\u004c\\u0049\\u0046\\u0054\\u002d\\u0038\\u0036\\u0030\\u0020\\u60ac\\u6d6e\\u80cc\\u5305'),
  'AX/TX-13 Dog Breath': t('\\u0041\\u0058\\u002f\\u0054\\u0058\\u002d\\u0031\\u0033\\u0020\\u201c\\u62a4\\u536b\\u72ac\\u201d\\u8150\\u606f'),
  'LIFT-182 Warp Pack': t('\\u004c\\u0049\\u0046\\u0054\\u002d\\u0031\\u0038\\u0032\\u0020\\u8dc3\\u8fc1\\u80cc\\u5305'),
  'EXO-45 Patriot Exosuit': t('\\u0045\\u0058\\u004f\\u002d\\u0034\\u0035\\u0020\\u7231\\u56fd\\u8005\\u5916\\u9aa8\\u9abc\\u673a\\u7532'),
  'EXO-49 Emancipator Exosuit': t('\\u0045\\u0058\\u004f\\u002d\\u0034\\u0039\\u0020\\u89e3\\u653e\\u8005\\u5916\\u9aa8\\u9abc\\u673a\\u7532'),
  'M-102 Fast Recon Vehicle': t('\\u004d\\u002d\\u0031\\u0030\\u0032\\u0020\\u5feb\\u901f\\u4fa6\\u5bdf\\u8f7d\\u5177'),
  'TD-220 Bastion MK XVI': t('\\u0054\\u0044\\u002d\\u0032\\u0032\\u0030\\u0020\\u5821\\u5792\\u0020\\u004d\\u004b\\u0020\\u0058\\u0056\\u0049'),
  'EXO-55 Breakthrough Exosuit': t('\\u0045\\u0058\\u004f\\u002d\\u0035\\u0035\\u0020\\u7a81\\u7834\\u8005\\u5916\\u9aa8\\u9abc\\u673a\\u7532'),
  'EXO-51 Lumberer Exosuit': t('\\u0045\\u0058\\u004f\\u002d\\u0035\\u0031\\u0020\\u4f10\\u6728\\u5de5\\u5916\\u9aa8\\u9abc\\u673a\\u7532'),
  Reinforce: t('\\u589e\\u63f4'),
  Resupply: t('\\u8865\\u7ed9'),
  'SoS Beacon': t('\\u6c42\\u6551\\u4fe1\\u6807'),
  'Eagle Rearm': t('\\u98de\\u9e70\\u8865\\u5f39'),
  'Call In Super Destroyer': t('\\u547c\\u53eb\\u8d85\\u7ea7\\u9a71\\u9010\\u8230'),
  'NUX-223 Hellbomb': t('\\u004e\\u0055\\u0058\\u002d\\u0032\\u0032\\u0033\\u0020\\u5730\\u72f1\\u706b\\u70b8\\u5f39'),
  'Upload Data': t('\\u4e0a\\u4f20\\u6570\\u636e'),
  'SSSD Delivery': t('\\u8fd0\\u9001\\u0020\\u0053\\u0053\\u0053\\u0044'),
  'Super Earth Flag': t('\\u8d85\\u7ea7\\u5730\\u7403\\u65d7\\u5e1c'),
  'Seismic Probe': t('\\u5730\\u9707\\u63a2\\u9488'),
  'Prospecting Drill': t('\\u52d8\\u63a2\\u94bb\\u673a'),
  'Dark Fluid Vessel': t('\\u6697\\u6d41\\u4f53\\u5bb9\\u5668'),
  'Tectonic Drill': t('\\u6784\\u9020\\u94bb\\u673a'),
  'Hive Breaker Drill': t('\\u866b\\u5de2\\u7834\\u62c6\\u94bb\\u673a'),
  'Cargo Container': t('\\u8d27\\u7269\\u96c6\\u88c5\\u7bb1'),
  'Reinforcement Pods': t('\\u589e\\u63f4\\u8231'),
  'SEAF Artillery': t('\\u0053\\u0045\\u0041\\u0046\\u706b\\u70ae'),
  'Orbital Illumination Flare': t('\\u8f68\\u9053\\u7167\\u660e\\u5f39'),
}

const allowedCategories = new Set(Object.keys(categoryTranslations))

const arrowMap = {
  'Stratagem Arrow Up.svg': 'u',
  'Stratagem Arrow Right.svg': 'r',
  'Stratagem Arrow Down.svg': 'd',
  'Stratagem Arrow Left.svg': 'l',
}

const slugify = (value) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const getTranslatedName = (name) => nameTranslations[name] ?? name
const getTranslatedCategory = (category) => categoryTranslations[category] ?? category
const buildId = (category, name) => `${slugify(category)}-${slugify(name)}`

const ensureDirectory = async (targetPath) => {
  await fs.mkdir(targetPath, { recursive: true })
}

const clearDirectory = async (targetPath) => {
  await ensureDirectory(targetPath)
  const entries = await fs.readdir(targetPath)
  await Promise.all(entries.map((entry) => fs.rm(path.join(targetPath, entry), { recursive: true, force: true })))
}

const iconFileName = (category, name, iconUrl) => {
  const parsed = new URL(iconUrl)
  const ext = path.extname(parsed.pathname) || '.svg'
  return `${slugify(category)}-${slugify(name)}${ext}`
}

const missionGroupAliases = {
  Ship: 'Ship',
  Objective: 'Objective',
  Other: 'Other',
}

const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  })

  await page.goto('https://helldivers.wiki.gg/wiki/Stratagems', {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  })
  await page.waitForTimeout(7000)

  const extracted = await page.evaluate(({ allowedCategoriesInner, arrowMapInner, missionGroupAliasesInner }) => {
    const result = []
    const parseTableRows = (table, category) => {
      const rows = Array.from(table.querySelectorAll('tr')).slice(1)
      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td'))
        const nameLink = row.querySelector('td:nth-child(2) a')
        const image = row.querySelector('img')
        const icon = image?.getAttribute('src') || image?.getAttribute('data-src') || ''
        const code = Array.from(cells[2]?.querySelectorAll('img') || [])
          .map((img) => arrowMapInner[img.getAttribute('alt') || ''] || '')
          .join('')
        const name = nameLink?.textContent?.trim() || cells[1]?.textContent?.trim() || ''

        if (!name || !icon || !code) {
          continue
        }

        result.push({
          category,
          name,
          icon,
          code,
        })
      }
    }

    const currentSectionHeading = Array.from(document.querySelectorAll('#mw-content-text h2')).find(
      (node) => node.textContent?.trim() === 'Current Stratagems',
    )

    if (currentSectionHeading) {
      let node = currentSectionHeading.nextElementSibling
      while (node) {
        if (node.tagName === 'H2') {
          break
        }
        if (node.tagName === 'H3') {
          const category = node.textContent?.trim() || ''
          if (allowedCategoriesInner.includes(category)) {
            let tableNode = node.nextElementSibling
            while (tableNode && !['TABLE', 'H2', 'H3'].includes(tableNode.tagName)) {
              tableNode = tableNode.nextElementSibling
            }
            if (tableNode?.tagName === 'TABLE') {
              parseTableRows(tableNode, category)
            }
          }
        }
        node = node.nextElementSibling
      }
    }

    const missionSectionHeading = Array.from(document.querySelectorAll('#mw-content-text h2')).find(
      (node) => node.textContent?.trim() === 'Mission Stratagems',
    )

    if (missionSectionHeading) {
      let node = missionSectionHeading.nextElementSibling
      let currentMissionGroup = ''

      while (node) {
        if (node.tagName === 'H2') {
          break
        }
        if (node.tagName === 'H3') {
          currentMissionGroup = node.textContent?.trim() || ''
        }
        if (node.tagName === 'TABLE') {
          const category = missionGroupAliasesInner[currentMissionGroup]
          if (category && allowedCategoriesInner.includes(category)) {
            parseTableRows(node, category)
          }
        }
        node = node.nextElementSibling
      }
    }

    return result
  }, {
    allowedCategoriesInner: [...allowedCategories],
    arrowMapInner: arrowMap,
    missionGroupAliasesInner: missionGroupAliases,
  })

  await clearDirectory(iconsDir)

  const payload = []
  for (const item of extracted) {
    const iconUrl = new URL(item.icon, 'https://helldivers.wiki.gg').toString()
    const fileName = iconFileName(item.category, item.name, iconUrl)
    const iconResponse = await page.request.get(iconUrl)
    if (!iconResponse.ok()) {
      throw new Error(`Failed to download icon for ${item.name}: ${iconResponse.status()}`)
    }

    await fs.writeFile(path.join(iconsDir, fileName), await iconResponse.body())

    payload.push({
      id: buildId(item.category, item.name),
      nameZh: getTranslatedName(item.name),
      categoryZh: getTranslatedCategory(item.category),
      command: item.code,
      iconPath: `/assets/icons/${fileName}`,
      nameEn: item.name,
      categoryEn: item.category,
    })
  }

  payload.sort((left, right) => {
    const leftIndex = categorySortOrder.indexOf(left.categoryEn)
    const rightIndex = categorySortOrder.indexOf(right.categoryEn)
    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex
    }
    return left.nameEn.localeCompare(right.nameEn)
  })

  await fs.writeFile(outputDataPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  const untranslated = payload.filter((item) => item.nameZh === item.nameEn)
  if (untranslated.length > 0) {
    console.warn(
      `Warning: ${untranslated.length} entries still use English names: ${untranslated.map((item) => item.nameEn).join(', ')}`,
    )
  }

  console.log(`Synced ${payload.length} stratagems from wiki.`)
} finally {
  await browser.close()
}
