const componentToHex = (c) => c.toString(16).padStart(2, '0')
const rgbToHex = (col) => {
  if(!col) return null
  let [r,g,b] = col
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b)
}
const hexToRgb = (hex) => {
  const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return res ? [ parseInt(res[1], 16), parseInt(res[2], 16), parseInt(res[3], 16) ] : null
}

const hslToRgb = (col) => {
  if(!col) return null
  let [h,s,l] = col,
      c = (1 - Math.abs(2*l - 1)) * s,
      H = h/60,
      x = c*(1 - Math.abs(H % 2 - 1))
      m = l - c/2
  let r0, g0, b0
  switch(Math.floor(H)) {
    case 0: [r0,g0,b0] = [c,x,0];break
    case 1: [r0,g0,b0] = [x,c,0];break
    case 2: [r0,g0,b0] = [0,c,x];break
    case 3: [r0,g0,b0] = [0,x,c];break
    case 4: [r0,g0,b0] = [x,0,c];break
    case 5: [r0,g0,b0] = [c,0,x]
  }
  return [Math.round((r0 + m)*255), Math.round((g0 + m)*255), Math.round((b0 + m)*255)]
}

const rgbToHsl = (col) => {
  if(!col) return null 
  let [R,G,B] = col,
      r = R/255, g = G/255, b = B/255,
      xmax = Math.max(r,g,b),
      xmin = Math.min(r,g,b),
      c = xmax - xmin,
      l = (xmax + xmin)/2
  let h = 0
  if(c !== 0) {
    if(xmax === r) {
      h = 60*((g-b)/c % 6)
    } else if(xmax === g) {
      h = 60*((b-r)/c + 2)
    } else {
      h = 60*((r-g)/c + 4)
    }
  }
  let s = 0
  if(l !== 0 && l !== 1) {
    s = (xmax-l) / Math.min(l, 1-l)
  }
  return [h,s,l]
}

function colourDifference([r1, g1, b1], [r2, g2, b2]) {
  const rmean = (r1 + r2) / 2, r = r1 - r2, g = g1 - g2, b = b1 - b2
  return Math.sqrt((((512+rmean)*r*r)>>8) + 4*g*g + (((767-rmean)*b*b)>>8))
}

const S = 0.95
const L = 0.8
const avg = (a,b) => { return Math.sqrt((a*a+b*b)/2) }
const hexTriad = (hex) => {
  const col = hexToRgb(hex),
        [h,s,l] = rgbToHsl(col),
        H = h*(1+Math.abs(s-l)/8) + 40*(s-0.5),
        colLight = hslToRgb([(H + 130 + 50*Math.sin(40*(s-0.5)*(l-0.5))) % 360, avg(s,S), avg(l,L)]),
        colDark = hslToRgb([(H + 260 + 40*(l-0.5)) % 360, 1-avg(1-s,S), 1-avg(1-L,L)])
  return [colDark, col, colLight]
}