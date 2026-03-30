import { useState, useEffect, useRef } from 'react'
import { Input } from './components/ui/input'
import { Card } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Search, Loader2 } from 'lucide-react'

type Nutrient = { nutrient: string; unit: string; size: number }
type Serving = { name: string; size: number; unit: string; is_default: boolean }
type Category = { name: string; image_url: string | null }
type Brand = { name: string } | null

type Food = {
  id: string
  name: string
  country: string
  source: string
  category: Category
  brand: Brand
  nutrients: Nutrient[]
  servings: Serving[]
  tags: string[]
  nutri_score: string | null
}

type ApiResponse = { data: Food[] }

function getNutrient(nutrients: Nutrient[], name: string) {
  return nutrients.find((n) => n.nutrient === name)
}

function getDefaultServing(servings: Serving[]) {
  return servings.find((s) => s.is_default && s.unit === 'g') ?? servings[0]
}

function MacroBadge({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex flex-col items-center min-w-13">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold text-foreground">
        {value % 1 === 0 ? value : value.toFixed(1)}
        <span className="text-[11px] font-normal text-muted-foreground ml-0.5">{unit}</span>
      </span>
    </div>
  )
}

function FoodCard({ food }: { food: Food }) {
  const serving = getDefaultServing(food.servings)
  const multiplier = serving?.size ?? 100

  const calories = getNutrient(food.nutrients, 'calories')
  const protein = getNutrient(food.nutrients, 'protein')
  const carbs = getNutrient(food.nutrients, 'carbs')
  const fat = getNutrient(food.nutrients, 'fat')

  const macros = [
    { label: 'cal', n: calories, unit: 'kcal' },
    { label: 'protein', n: protein, unit: 'g' },
    { label: 'carbs', n: carbs, unit: 'g' },
    { label: 'fat', n: fat, unit: 'g' },
  ]

  // const imageUrl = food.category.image_url

  return (
    <Card className="flex items-start gap-4 p-4 hover:shadow-md transition-shadow">

      <div className="flex-1 min-w-0 w-full">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className='flex flex-col items-start'>
            <h3 className="font-semibold text-foreground leading-tight">{food.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {food.brand ? food.brand.name + ' · ' : ''}
              {food.category.name}
              {serving ? ` · (${serving.size}${serving.unit})` : ''}
            </p>
          </div>
          <div className="flex gap-1 flex-wrap">
            {/* {food.source === 'verified' && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                verified
              </Badge>
            )} */}
            {food.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-3 pt-3 border-t border-border/50 flex-wrap">
          {macros.map(({ label, n, unit }) =>
            n ? (
              <MacroBadge
                key={label}
                label={label}
                value={parseFloat((n.size * multiplier).toFixed(1))}
                unit={unit}
              />
            ) : null,
          )}
        </div>
      </div>
    </Card>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Food[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setResults([])
      setSearched(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/v1/search?q=${encodeURIComponent(query)}&country=ar`,
          {
            headers: {
              'Authorization': `Bearer 5d3d5d829e0a7478dac3b681bceb8cb59d5dcee16732e9bdd3e1d574bbf2b799`
            },
          }
        )
        if (!res.ok) throw new Error(`Error ${res.status}`)
        const json: ApiResponse = await res.json()
        setResults(json.data ?? [])
        setSearched(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-10 text-center flex items-center justify-center gap-4">
          <img src="/logo.png" alt="Nutria API Logo" className="size-14 rounded-md" />
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Nutria API</h1>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 h-11 text-base"
            placeholder="Search foods… e.g. papas, arroz, pollo"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive text-center mb-4">{error}</p>
        )}

        {results.length > 0 && (
          <div className="flex flex-col gap-3">
            {results.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        )}

        {searched && !loading && results.length === 0 && (
          <p className="text-center text-muted-foreground text-sm">No results for "{query}"</p>
        )}

        {!searched && !loading && (
          <p className="text-center text-muted-foreground/50 text-sm">
            Start typing to search
          </p>
        )}
      </div>
    </div>
  )
}
