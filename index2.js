let selectedHex = document.cookie.match(/#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/ig)

const duluxColours = window.dulux.flat().map(([hex,names]) => [hex, hexToRgb(hex), names[0]])

const duluxCoords = (name) => {
  for(let i = 0; i < window.dulux.length; i++) {
    let group = window.dulux[i];
    for(let j = 0; j < group.length; j++) {
      let nameHere = group[j][1][0]
      if(name === nameHere) {
        return [ i, j % 3, Math.floor(j/3) ]
      }
    }
  }
}
const duluxFromCoords = ([i, jx, jy]) => window.dulux[i][jy*3+jx]

function colourDifference([r1, g1, b1], [r2, g2, b2]) {
  const rmean = (r1 + r2) / 2, r = r1 - r2, g = g1 - g2, b = b1 - b2
  return Math.sqrt((((512+rmean)*r*r)>>8) + 4*g*g + (((767-rmean)*b*b)>>8))
}

const closestDulux = (col0) => {
  let min = Infinity, minHex = null, minName = null
  for(const [hex, col, name] of duluxColours) {
    const diff = colourDifference(col0, col)
    if(diff < min) {
      min = diff
      minHex = hex
      minName = name
    }
  }
  return minName
}

const groupDistanceUp = (a,b) => {
  return (b-a+7)%7
}
const groupDistance = (a,b) => {
  return Math.min((a-b+7)%7, (b-a+7)%7)
}

const duluxTriad = (hex) => {
  const [colDark, col, colLight] = hexTriad(hex)

  const coordsDark  = duluxCoords(closestDulux(colDark)),
        colName     = closestDulux(col),
        coords      = duluxCoords(colName),
        coordsLight = duluxCoords(closestDulux(colLight))
  
  let group = coords[0], groupDark = coordsDark[0], groupLight = coordsDark[0]
  if(groupDistance(group, groupDark) == 0) {
    if(groupDistanceUp(group, groupDark) == 0) {
      groupDark = (group + 1) % 7
    } else {
      groupDark = (group + 6) % 7;
    }
  }
  let min = Infinity, newGroupLight = null;
  for(let i = 0; i <= 6; i++) {
    if(groupDistance(group,i) == 0 || groupDistance(groupDark,i) == 0 || Math.max(groupDistance(group,i),groupDistance(groupDark,i),groupDistance(group,groupDark))<=2) continue
    let dist = groupDistance(i, groupLight)
    if(dist < min) {
      min = dist
      newGroupLight = i
    }
  }
  groupLight = newGroupLight

  const newCoordsDark = [ groupDark, (coords[1] + 2)%3, coordsDark[2]+(coords[2]%3 - 1) ],
        newCoordsLight = [ groupLight, (coords[1] + 1)%3, coordsLight[2]-(coordsLight[2]%3 - 1) ]

  return [ duluxFromCoords(newCoordsDark), [ hex, [ colName ] ], duluxFromCoords(newCoordsLight) ]
}

function doSelection() {
  const elems = document.querySelectorAll('.colour'),
        elemsByName = {},
        groups = document.querySelectorAll('.group')

  function getAbsoluteBounds(elem) {
    const top  = elem.offsetTop,
          left = elem.offsetLeft,
          parentBounds = elem.offsetParent.getBoundingClientRect(),
          bottom = parentBounds.height - (top + elem.offsetHeight),
          right  = parentBounds.width  - (left + elem.offsetWidth)
    
    return { top, left, bottom, right }
  }

  window.addEventListener('click', ({ target }) => {
    groups.forEach((group) => {
      const overlay = group.querySelector('.groupoverlay')

      function cancel() {
        if(overlay.getAttribute('for')) {
          overlay.classList.remove('ready')

          const elem = elemsByName[overlay.getAttribute('for')]
          overlay.removeAttribute('for')

          const { top,left,bottom,right } = getAbsoluteBounds(elem)
          overlay.style.top    = `${Math.round(top)}px`
          overlay.style.left   = `${Math.round(left)}px`
          overlay.style.bottom = `${Math.round(bottom)}px`
          overlay.style.right  = `${Math.round(right)}px`

          window.setTimeout(() => {
            group.classList.remove('focus')
          }, 475)
        }
      }

      if(group.contains(target)) {
        if(overlay.querySelector('.confirm').contains(target)) {
          selectedHex = elemsByName[overlay.getAttribute('for')].getAttribute('colour')

          overlay.classList.remove('ready', 'selected')
          overlay.removeAttribute('for')
          group.classList.remove('focus')

          document.querySelector('.app').classList.remove('selecting')

          document.cookie = "color=" + selectedHex
          window.location.reload()
        } else if(overlay.querySelector('.cancel').contains(target)) {
          overlay.classList.remove('ready', 'selected')
          overlay.removeAttribute('for')
          group.classList.remove('focus')
        }

        if(overlay.classList.contains('ready')) {
          overlay.classList.add('selected')
        }
      } else {
        cancel()
      }
    })
  })

  elems.forEach((elem) => {
    const hex  = elem.getAttribute('colour'),
          name = elem.getAttribute('name')
    elemsByName[name] = elem

    elem.addEventListener('click', () => {
      const {top,left,bottom,right} = getAbsoluteBounds(elem)
      
      const overlay = elem.offsetParent.querySelector('.groupoverlay')
      overlay.style.transition = 'none'
      overlay.style.top    = `${Math.round(top)}px`
      overlay.style.left   = `${Math.round(left)}px`
      overlay.style.bottom = `${Math.round(bottom)}px`
      overlay.style.right  = `${Math.round(right)}px`
      overlay.style.background = hex

      overlay.querySelector('h1').innerText = name
      if(colourDifference(hexToRgb(hex), [255,255,255]) <= 150) {
        overlay.classList.add('black')
      } else {
        overlay.classList.remove('black')
      }

      window.setTimeout(() => {
        overlay.style.transition = 'top .4s ease-in-out .075s,bottom .4s ease-in-out .075s,left .2s ease-in-out, right .2s ease-in-out'

        window.setTimeout(() => {
          overlay.style.top = 0; overlay.style.left = 0
          overlay.style.bottom = 0; overlay.style.right = 0
          overlay.classList.add('ready')
        }, 0)
      }, 0)

      elem.offsetParent.classList.add('focus')
      overlay.setAttribute('for', name)
    })
  })
}

////

function doStuffHavingSelected() {
  document.cookie = "color=" + selectedHex

  const date = new Date,
        dayOfWeek = (["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"])[date.getDay()],
        dateOfMonth = String(date.getDate()).padStart(2, '0'),
        month = date.toLocaleString('default', { month: 'long' })

  document.querySelector('.todaydate').innerText = `${dayOfWeek}, ${month} ${dateOfMonth}`

  const [ [darkHex, [darkName]], [sunHex, [sunName]], [lightHex, [lightName]] ] = duluxTriad(selectedHex)
  const doValentine = false //sunName === 'Satsuma Spice'

  document.querySelector('.sign.sun').addEventListener('click', () => {
    document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
    document.querySelector('.app').classList.add('selecting')
    window.location.reload()
  })

  const rand = getRand(date.toDateString() + sunName),
        randJustDate = getRand(date.toDateString())

  const doSubtleValentine = rand() < 0.1 && (sunName === 'Satsuma Spice')

  const moon   = document.querySelector('.sign.moon'), 
        sun    = document.querySelector('.sign.sun'),
        rising = document.querySelector('.sign.rising')

  moon.querySelector('.circle').style.backgroundColor = darkHex
  moon.querySelector('.name').innerText = darkName
  sun.querySelector('.circle').style.backgroundColor = sunHex
  sun.querySelector('.name').innerText = sunName
  rising.querySelector('.circle').style.backgroundColor = lightHex
  rising.querySelector('.name').innerText = lightName

  const [ todayHex, todayRgb, todayName ] = duluxColours[Math.floor(randJustDate() * duluxColours.length)]
  const elemColourToday = document.querySelector('.colourtoday')
  const todayOppositeRgb = [255-todayRgb[0],255-todayRgb[1],255-todayRgb[2]]
  {
    const darkness = colourDifference(todayRgb, [255,255,255])
    if(darkness <= 150) {
      elemColourToday.parentNode.style.background = `rgba(0, 0, 0, 0.8)`
    }
  }
  elemColourToday.style.color = todayHex
  elemColourToday.parentNode.style.color = todayHex
  elemColourToday.innerText = todayName

  const strings = initStrings(rand, { moon: darkName, sun: sunName, rising: lightName })

  const interaction = (col) => {
    if(doValentine) return 'love'

    let diffMain = colourDifference(col, todayRgb),
        [h,s,l]  = rgbToHsl(col),
        [H,S,L]  = rgbToHsl(todayRgb),
        diffOpp  = colourDifference(col, todayOppositeRgb)

    if(diffOpp <= 180 || Math.abs(s-S)*Math.abs(l-L)>0.4) {
      return 'clash'
    } else if(diffMain <= 200 || Math.min((h-H+360)%360, (H-h+360)%360) <= 30) {
      return 'synergy'
    } else {
      return 'weak'
    }
  }
  const doInteraction = (name, hex) => {
    const elem = document.querySelector(`.symboldesc.${name}`),
          int = interaction(hexToRgb(hex))

    elem.querySelector('.gradient').style.background = `linear-gradient(135deg, ${hex} 10%, ${todayHex} 90%)`

    elem.querySelector('.interactiondesc').innerText = int
    elem.querySelector('.interactiondesc').classList.add(int)

    elem.querySelector('.flavour').innerText = doValentine ? (name === 'moon' ? 'I love you.' : (name === 'sun' ? 'I love you so much.' : 'You\'re the best.')) : strings.processString(`#${int}${name}`)
  }

  doInteraction('moon', darkHex)
  doInteraction('sun', sunHex)
  doInteraction('rising', lightHex)

  document.querySelector('.mainsentence').innerText = doValentine ? strings.processString("#valentine") : strings.processString("#mainSentence")

  window.setTimeout(() => {
  if(doValentine || doSubtleValentine) {
    // module aliases
    const {Engine, Render, Runner, Bodies, Body, Vector, Composite, Events} = Matter    
    const engine = Engine.create()

    const bounds = document.querySelector('.two').getBoundingClientRect()
    const height = bounds.height + 120
    const groundLevel = 100+document.querySelector('.mainsentence').offsetTop,
          groundWidth = document.querySelector('.mainsentence').getBoundingClientRect().width

    const render = Render.create({
      element: document.querySelector('.canvas'),
      engine: engine,
      options: {
        width:  bounds.width,
        height,
        wireframes: false 
      }
    })

    function pickRandom(xs) {
      return xs[Math.floor(Math.random() * xs.length)]
    }

    function makeBox() {
      const w = groundWidth / 1.5,
            h = 50
      
      const img = pickRandom([ 'carnation_red', 'carnation_pink', 'carnation_orange', 'peony_light', 'peony_pink' ])

      const body = Bodies.circle(
        (bounds.width - w) / 2 + Math.floor(Math.random() * w),
        -h + Math.floor(Math.random() * h), 
        5,
        {
          render: {
              opacity: doSubtleValentine ? 0.4 : 0.8,
              sprite: {
                  texture: `./${img}.png`,
                  xScale: 0.3, yScale: 0.3
              }
          }
        }
      )

      Composite.add(engine.world, body)

      return body
    }
    
    const touched = {}
    Events.on(engine, 'afterUpdate', function() {
      let force = Vector.create(0, -1/120)
      force = Vector.rotate(force, (Math.PI/4)*(Math.random()-0.5))

      engine.world.bodies.forEach((body) => {
        if(touched[body.id]) {
          if(body.position.y >= height) {
            Composite.remove(engine.world, body)
          }
        } else {
          if(body.position.y >= groundLevel) {
            Body.applyForce(body, Vector.sub(body.position, Vector.create(0,2)), force)
            touched[body.id] = true
          }
        }
      })
    })

    window.setInterval(makeBox, 35)

    Render.run(render)
    const runner = Runner.create()
    Runner.run(runner, engine)
  }
  })
}

if(selectedHex) {
  selectedHex = selectedHex[0]
  document.querySelector('.app').classList.remove('selecting')
  doStuffHavingSelected()
} else {
  doSelection()
}
