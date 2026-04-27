import { useRef, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Button } from "@/components/ui/button"
import Icon from "@/components/ui/icon"
import type { SectionProps } from "@/types"

const HOMEWORK_URL = "https://functions.poehali.dev/b5589a6a-83ed-4752-8b8d-544eb4cb0e4c"

const SUBJECTS = [
  "Математика", "Алгебра", "Геометрия", "Физика", "Химия",
  "Биология", "История", "География", "Русский язык", "Литература",
  "Английский язык", "Информатика", "Обществознание", "Другое",
]

function centerAspectCrop(width: number, height: number) {
  return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, width / height, width, height), width, height)
}

function getCroppedBase64(image: HTMLImageElement, crop: Crop): Promise<string> {
  const canvas = document.createElement('canvas')
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  const pixelRatio = window.devicePixelRatio
  const cropX = (crop.x / 100) * image.width
  const cropY = (crop.y / 100) * image.height
  const cropW = (crop.width / 100) * image.width
  const cropH = (crop.height / 100) * image.height
  canvas.width = cropW * scaleX * pixelRatio
  canvas.height = cropH * scaleY * pixelRatio
  const ctx = canvas.getContext('2d')!
  ctx.scale(pixelRatio, pixelRatio)
  ctx.drawImage(image, cropX * scaleX, cropY * scaleY, cropW * scaleX, cropH * scaleY, 0, 0, cropW * scaleX, cropH * scaleY)
  return new Promise((resolve) => canvas.toBlob((blob) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(blob!)
  }, 'image/jpeg', 0.9))
}

export default function Section({ id, title, subtitle, content, isActive, showButton, buttonText, showUpload, onScrollToLast }: SectionProps) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [cropping, setCropping] = useState(false)
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null)
  const [croppedBase64, setCroppedBase64] = useState<string | null>(null)
  const [subject, setSubject] = useState("")
  const [sending, setSending] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => { setSrc(ev.target?.result as string); setCropping(true); setCroppedPreview(null) }
      reader.readAsDataURL(file)
    }
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height))
  }, [])

  const handleCropDone = async () => {
    if (imgRef.current && crop) {
      const b64 = await getCroppedBase64(imgRef.current, crop)
      setCroppedBase64(b64)
      setCroppedPreview(b64)
      setCropping(false)
    }
  }

  const handleReset = () => {
    setSrc(null); setCrop(undefined); setCropping(false)
    setCroppedPreview(null); setCroppedBase64(null); setSubject("")
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSend = async () => {
    if (!croppedBase64 || !subject) return
    setSending(true)
    const res = await fetch(HOMEWORK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo: croppedBase64, subject }),
    })
    const data = await res.json()
    setSending(false)
    navigate(`/status?id=${data.id}`)
  }

  return (
    <section id={id} className="relative h-screen w-full snap-start flex flex-col justify-center p-8 md:p-16 lg:p-24">
      {subtitle && (
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          {subtitle}
        </motion.div>
      )}
      <motion.h2
        className="text-4xl md:text-6xl lg:text-[5rem] xl:text-[6rem] font-bold leading-[1.1] tracking-tight max-w-4xl text-white"
        initial={{ opacity: 0, y: 50 }}
        animate={isActive ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        {title}
      </motion.h2>
      {content && (
        <motion.p
          className="text-lg md:text-xl lg:text-2xl max-w-2xl mt-6 text-neutral-400"
          initial={{ opacity: 0, y: 50 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {content}
        </motion.p>
      )}
      {showButton && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 md:mt-16"
        >
          <Button
            variant="outline"
            size="lg"
            className="text-[#FF4D00] bg-transparent border-[#FF4D00] hover:bg-[#FF4D00] hover:text-black transition-colors"
            onClick={() => onScrollToLast?.()}
          >
            {buttonText}
          </Button>
        </motion.div>
      )}
      {showUpload && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col gap-4 max-w-lg w-full"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {!src && !croppedPreview && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/30 rounded-2xl p-10 text-white hover:border-[#FF4D00] hover:bg-white/5 transition-all cursor-pointer"
            >
              <Icon name="Camera" size={40} className="text-[#FF4D00]" />
              <span className="text-lg font-medium">Сделай фото или загрузи файл</span>
              <span className="text-sm text-neutral-400">JPG, PNG — любой формат</span>
            </button>
          )}

          {cropping && src && (
            <div className="flex flex-col gap-3">
              <p className="text-neutral-400 text-sm">Выдели нужную часть задания</p>
              <div className="rounded-xl overflow-hidden max-h-64">
                <ReactCrop crop={crop} onChange={setCrop} style={{ maxHeight: '16rem' }}>
                  <img
                    ref={imgRef}
                    src={src}
                    onLoad={onImageLoad}
                    style={{ maxHeight: '16rem', width: '100%', objectFit: 'contain' }}
                  />
                </ReactCrop>
              </div>
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="bg-[#FF4D00] text-black hover:bg-[#ff6a2a] transition-colors flex-1"
                  onClick={handleCropDone}
                >
                  <Icon name="Crop" size={18} className="mr-2" />
                  Применить обрезку
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white bg-transparent hover:bg-white/10"
                  onClick={handleReset}
                >
                  <Icon name="X" size={18} />
                </Button>
              </div>
            </div>
          )}

          {!cropping && croppedPreview && (
            <div className="flex flex-col gap-4">
              <img src={croppedPreview} alt="Обрезанное ДЗ" className="rounded-xl max-h-40 object-cover border border-white/20" />

              <div className="flex flex-col gap-2">
                <p className="text-sm text-neutral-400">Выбери предмет</p>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                        subject === s
                          ? "border-[#FF4D00] bg-[#FF4D00]/10 text-[#FF4D00]"
                          : "border-white/10 text-neutral-400 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="bg-[#FF4D00] text-black hover:bg-[#ff6a2a] transition-colors flex-1 disabled:opacity-40"
                  onClick={handleSend}
                  disabled={sending || !subject}
                >
                  <Icon name={sending ? "Loader" : "Send"} size={18} className={`mr-2 ${sending ? "animate-spin" : ""}`} />
                  {sending ? "Отправляю..." : "Отправить задание"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  title="Обрезать заново"
                  className="border-white/30 text-white bg-transparent hover:bg-white/10"
                  onClick={() => { setCropping(true); setCroppedPreview(null) }}
                >
                  <Icon name="Crop" size={18} />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white bg-transparent hover:bg-white/10"
                  onClick={handleReset}
                >
                  <Icon name="X" size={18} />
                </Button>
              </div>
              {!subject && <p className="text-xs text-neutral-500">Выбери предмет, чтобы отправить</p>}
            </div>
          )}
        </motion.div>
      )}
    </section>
  )
}
