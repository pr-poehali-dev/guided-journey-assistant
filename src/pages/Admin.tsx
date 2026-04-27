import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"

const ADMIN_URL = "https://functions.poehali.dev/78ef07e4-847f-4402-a2e6-689a5fff9509"
const ADMIN_PASSWORD = "admin1234"

const STATUS_LABELS: Record<string, string> = {
  pending: "Новая",
  in_progress: "В работе",
  done: "Готово",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400",
  in_progress: "text-blue-400",
  done: "text-green-400",
}

interface HWRequest {
  id: string
  photo_url: string
  status: string
  solution: string | null
  created_at: string
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)

  const submit = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "1")
      onLogin()
    } else {
      setError(true)
      setPassword("")
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-5">
        <div className="flex items-center gap-3 mb-2">
          <Icon name="Lock" size={24} className="text-[#FF4D00]" />
          <h1 className="text-xl font-bold text-white">Вход в админку</h1>
        </div>
        <Input
          type="password"
          placeholder="Введи пароль"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false) }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="bg-white/5 border-white/10 text-white placeholder:text-neutral-500"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm -mt-2">Неверный пароль</p>}
        <Button className="bg-[#FF4D00] text-black hover:bg-[#ff6a2a] w-full" onClick={submit}>
          Войти
        </Button>
      </div>
    </div>
  )
}

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("admin_auth") === "1")
  const [requests, setRequests] = useState<HWRequest[]>([])
  const [selected, setSelected] = useState<HWRequest | null>(null)
  const [solution, setSolution] = useState("")
  const [status, setStatus] = useState("pending")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch(ADMIN_URL)
    const data = await res.json()
    setRequests(data)
    setLoading(false)
  }

  useEffect(() => { if (authed) load() }, [authed])

  const openRequest = (r: HWRequest) => {
    setSelected(r)
    setSolution(r.solution || "")
    setStatus(r.status)
  }

  const save = async () => {
    if (!selected) return
    setSaving(true)
    await fetch(ADMIN_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, status, solution }),
    })
    setSaving(false)
    setSelected(null)
    load()
  }

  const logout = () => {
    sessionStorage.removeItem("admin_auth")
    setAuthed(false)
  }

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Icon name="BookOpen" size={28} className="text-[#FF4D00]" />
          <h1 className="text-2xl font-bold">Заявки на помощь с ДЗ</h1>
          <button onClick={load} className="ml-auto text-neutral-400 hover:text-white transition-colors">
            <Icon name="RefreshCw" size={18} />
          </button>
          <button onClick={logout} className="text-neutral-400 hover:text-white transition-colors" title="Выйти">
            <Icon name="LogOut" size={18} />
          </button>
        </div>

        {loading && <p className="text-neutral-400">Загружаю заявки...</p>}

        {!loading && requests.length === 0 && (
          <p className="text-neutral-400">Заявок пока нет.</p>
        )}

        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/10 hover:border-[#FF4D00]/50 transition-all cursor-pointer"
              onClick={() => openRequest(r)}
            >
              <img src={r.photo_url} alt="ДЗ" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-400">{new Date(r.created_at).toLocaleString("ru")}</p>
                <p className={`text-sm font-medium mt-1 ${STATUS_COLORS[r.status] || "text-white"}`}>
                  {STATUS_LABELS[r.status] || r.status}
                </p>
                {r.solution && (
                  <p className="text-sm text-neutral-300 truncate mt-1">{r.solution}</p>
                )}
              </div>
              <Icon name="ChevronRight" size={18} className="text-neutral-500 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-[#111] rounded-2xl border border-white/10 p-6 max-w-lg w-full flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Заявка</h2>
              <button onClick={() => setSelected(null)} className="text-neutral-400 hover:text-white">
                <Icon name="X" size={20} />
              </button>
            </div>

            <img src={selected.photo_url} alt="ДЗ" className="rounded-xl max-h-64 object-contain w-full border border-white/10" />

            <div className="flex flex-col gap-2">
              <label className="text-sm text-neutral-400">Статус</label>
              <div className="flex gap-2">
                {["pending", "in_progress", "done"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                      status === s
                        ? "border-[#FF4D00] bg-[#FF4D00]/10 text-[#FF4D00]"
                        : "border-white/10 text-neutral-400 hover:border-white/30"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-neutral-400">Решение / ответ</label>
              <Textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                placeholder="Напиши решение задания..."
                className="bg-white/5 border-white/10 text-white placeholder:text-neutral-500 min-h-[120px]"
              />
            </div>

            <Button
              className="bg-[#FF4D00] text-black hover:bg-[#ff6a2a] w-full"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Сохраняю..." : "Сохранить и отправить"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
