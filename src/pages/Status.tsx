import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import Icon from "@/components/ui/icon"

const HOMEWORK_URL = "https://functions.poehali.dev/b5589a6a-83ed-4752-8b8d-544eb4cb0e4c"

const STATUS_INFO: Record<string, { label: string; icon: string; color: string; desc: string }> = {
  pending: { label: "Получено", icon: "Clock", color: "text-yellow-400", desc: "Твоё задание получено, эксперт скоро возьмётся за него." },
  in_progress: { label: "Разбираем", icon: "Loader", color: "text-blue-400", desc: "Эксперт уже работает над твоим заданием — совсем скоро будет ответ." },
  done: { label: "Готово!", icon: "CheckCircle", color: "text-green-400", desc: "Задание разобрано! Смотри решение ниже." },
}

interface HWData {
  id: string
  photo_url: string
  status: string
  solution: string | null
  created_at: string
}

export default function Status() {
  const [params] = useSearchParams()
  const id = params.get("id")
  const [data, setData] = useState<HWData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    const poll = async () => {
      const res = await fetch(`${HOMEWORK_URL}?id=${id}`)
      if (!res.ok) { setError(true); setLoading(false); return }
      const json: HWData = await res.json()
      setData(json)
      setLoading(false)
    }
    poll()
    const interval = setInterval(poll, 10000)
    return () => clearInterval(interval)
  }, [id])

  const info = data ? STATUS_INFO[data.status] || STATUS_INFO.pending : null

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white">
      <div className="max-w-md w-full flex flex-col gap-6">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="BookOpen" size={24} className="text-[#FF4D00]" />
          <span className="text-lg font-semibold">Помощь с ДЗ</span>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-neutral-400">
            <Icon name="Loader" size={20} className="animate-spin" />
            Загружаю статус...
          </div>
        )}

        {(error || (!loading && !id)) && (
          <div className="text-red-400">Заявка не найдена. Проверь ссылку.</div>
        )}

        {data && info && (
          <>
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Icon name={info.icon} size={28} className={info.color} />
                <div>
                  <p className={`text-xl font-bold ${info.color}`}>{info.label}</p>
                  <p className="text-sm text-neutral-400 mt-0.5">{info.desc}</p>
                </div>
              </div>
              <img src={data.photo_url} alt="Твоё ДЗ" className="rounded-xl object-contain max-h-48 border border-white/10" />
            </div>

            {data.solution && (
              <div className="bg-white/5 rounded-2xl border border-[#FF4D00]/30 p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[#FF4D00] font-semibold">
                  <Icon name="Lightbulb" size={20} />
                  Решение
                </div>
                <p className="text-white whitespace-pre-wrap leading-relaxed">{data.solution}</p>
              </div>
            )}

            {data.status !== "done" && (
              <p className="text-xs text-neutral-500 text-center">Страница обновляется автоматически каждые 10 секунд</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
