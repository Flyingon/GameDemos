import { assetManager, sys, Texture2D, ImageAsset } from 'cc'

function textureFromImage(img: ImageAsset): Texture2D {
  const tex = new Texture2D()
  tex.image = img
  return tex
}

export async function selectFileAndLoadTexture(): Promise<Texture2D> {
  if (!sys.isBrowser) throw new Error('Upload only available in web for now')
  return new Promise<Texture2D>((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.style.position = 'fixed'
    input.style.left = '-9999px'
    input.onchange = () => {
      const file = input.files && input.files[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }
      const url = URL.createObjectURL(file)
      assetManager.loadRemote<ImageAsset>(url, { ext: '.png' }, (err, img) => {
        URL.revokeObjectURL(url)
        if (err || !img) {
          reject(err ?? new Error('Failed to load image'))
        } else {
          try {
            const tex = textureFromImage(img)
            resolve(tex)
          } catch (e) {
            reject(e as any)
          }
        }
      })
    }
    document.body.appendChild(input)
    input.click()
    setTimeout(() => document.body.removeChild(input), 3000)
  })
}