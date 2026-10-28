import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Clock3,
  Database,
  Download,
  Filter,
  GraduationCap,
  HeartPulse,
  Info,
  LayoutDashboard,
  Leaf,
  Menu,
  Moon,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Table2,
  Target,
  Users,
  X,
  Zap,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ageGroup, correlation, mean, median, quantile, type UsageRecord } from './data'
import { fetchMetadata, fetchRecords, mapRecord, type ApiMetadata } from './api'

type Page =
  | 'Overview'
  | 'Data Explorer'
  | 'Usage Patterns'
  | 'Lifestyle Analysis'
  | 'Statistical Insights'
  | 'Findings & Recommendations'
  | 'SDG Impact'
  | 'About Project'

type Filters = {
  age: string
  gender: string
  addiction: string
  stress: string
  maxScreen: number
}

const initialFilters: Filters = {
  age: 'All ages',
  gender: 'All genders',
  addiction: 'All categories',
  stress: 'All levels',
  maxScreen: 13,
}

const navItems: { label: Page; icon: typeof LayoutDashboard }[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Data Explorer', icon: Table2 },
  { label: 'Usage Patterns', icon: Smartphone },
  { label: 'Lifestyle Analysis', icon: HeartPulse },
  { label: 'Statistical Insights', icon: BarChart3 },
  { label: 'Findings & Recommendations', icon: Sparkles },
  { label: 'SDG Impact', icon: Leaf },
  { label: 'About Project', icon: CircleHelp },
]

const colors = {
  teal: '#168C87',
  green: '#70A47B',
  amber: '#D9A441',
  coral: '#DD775F',
  navy: '#172033',
  muted: '#768196',
  grid: '#E9ECEF',
}

const chartTooltipStyle = {
  border: '1px solid #E4E8EC',
  borderRadius: 12,
  boxShadow: '0 10px 25px rgba(23,32,51,.08)',
  fontSize: 12,
}

function Button({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`button ${className}`} {...props}>
      {children}
    </button>
  )
}

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <section className={`card ${className}`}>{children}</section>
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <div className="select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown size={14} />
      </div>
    </label>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="section-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <Database size={24} />
      <strong>Data unavailable</strong>
      <span>{label}</span>
    </div>
  )
}

function FiltersPanel({
  filters,
  setFilters,
  filteredCount,
  open,
  onClose,
}: {
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
  filteredCount: number
  open: boolean
  onClose: () => void
}) {
  const set = (key: keyof Filters, value: string | number) =>
    setFilters((current) => ({ ...current, [key]: value }))

  return (
    <aside className={`filters-panel ${open ? 'filters-open' : ''}`}>
      <div className="filters-title">
        <div>
          <Filter size={17} />
          <strong>Filter data</strong>
        </div>
        <Button className="icon-button mobile-only" onClick={onClose} aria-label="Close filters">
          <X size={18} />
        </Button>
      </div>
      <p className="filter-subtitle">{filteredCount} records in view</p>
      <Select
        label="Age group"
        value={filters.age}
        onChange={(value) => set('age', value)}
        options={['All ages', '12-17', '18-24', '25-34', '35-44', '45-54', '55+']}
      />
      <Select
        label="Gender"
        value={filters.gender}
        onChange={(value) => set('gender', value)}
        options={['All genders', 'Female', 'Male', 'Other']}
      />
      <Select
        label="Addiction category"
        value={filters.addiction}
        onChange={(value) => set('addiction', value)}
        options={['All categories', 'Low', 'Moderate', 'High', 'Severe']}
      />
      <Select
        label="Stress level"
        value={filters.stress}
        onChange={(value) => set('stress', value)}
        options={['All levels', 'Low (0-33)', 'Moderate (34-66)', 'High (67-100)']}
      />
      <label className="range-field">
        <span>
          Screen time
          <strong>≤ {filters.maxScreen}h</strong>
        </span>
        <input
          type="range"
          min="0"
          max="13"
          step=".5"
          value={filters.maxScreen}
          onChange={(event) => set('maxScreen', Number(event.target.value))}
        />
        <div>
          <span>3h</span>
          <span>9h</span>
        </div>
      </label>
      <Button className="reset-button" onClick={() => setFilters(initialFilters)}>
        <RefreshCw size={15} />
        Reset filters
      </Button>
    </aside>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Database
  label: string
  value: string
  detail: string
  tone: string
}) {
  return (
    <Card className="kpi-card">
      <div className={`kpi-icon ${tone}`}>
        <Icon size={19} />
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-detail">
        <Info size={13} />
        {detail}
      </div>
    </Card>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
  className = '',
  badge,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  className?: string
  badge?: string
}) {
  return (
    <Card className={`chart-card ${className}`}>
      <div className="chart-heading">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        {badge && <span className="metric-badge">{badge}</span>}
      </div>
      {children}
    </Card>
  )
}

function Overview({ data }: { data: UsageRecord[] }) {
  const avgScreen = mean(data.map((item) => item.screenTime))
  const avgSleep = mean(data.map((item) => item.sleep))
  const highPct = data.length
    ? (data.filter((item) => item.addiction === 'High').length / data.length) * 100
    : 0
  const r = correlation(
    data.map((item) => item.screenTime),
    data.map((item) => item.sleep),
  )
  const histogram = Array.from({ length: 7 }, (_, index) => {
    const start = index + 2
    return {
      bin: `${start}–${start + 1}`,
      count: data.filter((item) => item.screenTime >= start && item.screenTime < start + 1).length,
    }
  })
  const activity = [
    { name: 'Social media', hours: mean(data.map((item) => item.socialMedia)), fill: colors.teal },
    { name: 'Gaming', hours: mean(data.map((item) => item.gaming)), fill: colors.amber },
    { name: 'Other apps', hours: mean(data.map((item) => item.otherApps)), fill: colors.green },
  ]
  const groups = ['12-17', '18-24', '25-34', '35-44', '45-54', '55+'].map((group) => {
    const subset = data.filter((item) => ageGroup(item.age) === group)
    return {
      group,
      screen: mean(subset.map((item) => item.screenTime)),
      sleep: mean(subset.map((item) => item.sleep)),
    }
  })
  const boxData = ['Low', 'Moderate', 'High', 'Severe'].map((category) => {
    const values = data
      .filter((item) => item.addiction === category)
      .map((item) => item.screenTime)
    return {
      category,
      min: values.length ? Math.min(...values) : 0,
      q1: values.length ? quantile(values, 0.25) : 0,
      median: values.length ? median(values) : 0,
      q3: values.length ? quantile(values, 0.75) : 0,
      max: values.length ? Math.max(...values) : 0,
    }
  })
  const boxMinRaw = boxData.reduce((min, item) => Math.min(min, item.min ?? min), Infinity)
  const boxMaxRaw = boxData.reduce((max, item) => Math.max(max, item.max ?? max), -Infinity)
  const boxPad = Number.isFinite(boxMinRaw) && Number.isFinite(boxMaxRaw) ? (boxMaxRaw - boxMinRaw) * 0.08 || 1 : 1
  const boxAxisMin = Number.isFinite(boxMinRaw) ? boxMinRaw - boxPad : 0
  const boxAxisMax = Number.isFinite(boxMaxRaw) ? boxMaxRaw + boxPad : 10
  const boxAxisRange = Math.max(0.0001, boxAxisMax - boxAxisMin)
  const boxTicks = Array.from({ length: 5 }, (_, index) => boxAxisMin + (boxAxisRange * index) / 4)


  return (
    <>
      <div className="kpi-grid">
        <KpiCard
          icon={Database}
          label="Total records"
          value={data.length.toLocaleString()}
          detail="After active filters"
          tone="teal"
        />
        <KpiCard
          icon={Clock3}
          label="Avg. daily screen time"
          value={`${avgScreen.toFixed(1)}h`}
          detail="Dataset mean"
          tone="coral"
        />
        <KpiCard
          icon={Moon}
          label="Avg. sleep duration"
          value={`${avgSleep.toFixed(1)}h`}
          detail="Self-reported nightly sleep"
          tone="indigo"
        />
        <KpiCard
          icon={Zap}
          label="High addiction category"
          value={`${highPct.toFixed(1)}%`}
          detail="Self-reported category"
          tone="amber"
        />
      </div>

      <div className="charts-grid">
        <ChartCard title="Screen time distribution" subtitle="Daily screen time frequency · hours">
          {data.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={histogram} margin={{ top: 18, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid stroke={colors.grid} vertical={false} />
                <XAxis dataKey="bin" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: '#F4F6F7' }} />
                <Bar dataKey="count" name="Records" fill={colors.teal} radius={[5, 5, 1, 1]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="No records match the selected filters." />
          )}
        </ChartCard>

        <ChartCard
          title="Screen time vs sleep"
          subtitle="Daily screen time and nightly sleep · hours"
          badge={`Pearson r = ${r.toFixed(2)}`}
        >
          {data.length ? (
            <>
              <ResponsiveContainer width="100%" height={225}>
                <ScatterChart margin={{ top: 18, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke={colors.grid} />
                  <XAxis
                    type="number"
                    dataKey="screenTime"
                    name="Screen time"
                    unit="h"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="sleep"
                    name="Sleep"
                    unit="h"
                    domain={['dataMin - .3', 'dataMax + .3']}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={chartTooltipStyle} />
                  <Scatter data={data} fill={colors.coral} opacity={0.75} />
                </ScatterChart>
              </ResponsiveContainer>
              <div className="chart-note">
                <Info size={14} />
                Correlation describes association and does not imply causation.
              </div>
            </>
          ) : (
            <EmptyState label="Two numeric variables and matching records are required." />
          )}
        </ChartCard>

        <ChartCard
          title="Usage by addiction category"
          subtitle="Five-number screen-time summary · hours"
        >
          <div className="boxplot">
            <div className="box-axis">
              {boxTicks.map((tick) => (
                <span key={tick}>{tick.toFixed(1)}h</span>
              ))}
            </div>
            {boxData.map((item, index) => (
              <div className="box-row" key={item.category}>
                <span className="box-label">{item.category}</span>
                <div className="box-track">
                  {item.max ? (
                    <>
                      <div
                        className="box-whisker"
                        style={{
                          left: `${((item.min - boxAxisMin) / boxAxisRange) * 100}%`,
                          width: `${((item.max - item.min) / boxAxisRange) * 100}%`,
                        }}
                      />
                      <div
                        className={`box ${['green', 'amber', 'coral', 'severe'][index]}`}
                        style={{
                          left: `${((item.q1 - boxAxisMin) / boxAxisRange) * 100}%`,
                          width: `${((item.q3 - item.q1) / boxAxisRange) * 100}%`,
                        }}
                      >
                        <span
                          className="median"
                          style={{ left: `${((item.median - item.q1) / (item.q3 - item.q1 || 1)) * 100}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <span className="no-category">No matching records</span>
                  )}
                </div>
              </div>
            ))}
            <div className="box-legend">
              <span><i className="range-key" />Interquartile range</span>
              <span><i className="median-key" />Median</span>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Smartphone activity breakdown" subtitle="Average daily usage by activity">
          {data.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={activity} layout="vertical" margin={{ top: 18, right: 22, left: 12 }}>
                <CartesianGrid stroke={colors.grid} horizontal={false} />
                <XAxis type="number" unit="h" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  width={84}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => `${Number(value).toFixed(1)}h`} />
                <Bar dataKey="hours" radius={[0, 5, 5, 0]}>
                  {activity.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="Activity columns are available, but no filtered records remain." />
          )}
        </ChartCard>

        <ChartCard
          title="Demographic comparison"
          subtitle="Average screen time and sleep by age group"
          className="wide-card"
        >
          {data.length ? (
            <ResponsiveContainer width="100%" height={275}>
              <ComposedChart data={groups} margin={{ top: 18, right: 10, left: -18 }}>
                <CartesianGrid stroke={colors.grid} vertical={false} />
                <XAxis dataKey="group" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 9]} unit="h" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => `${Number(value).toFixed(1)}h`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="screen" name="Screen time" fill={colors.teal} radius={[5, 5, 0, 0]} barSize={30} />
                <Line
                  dataKey="sleep"
                  name="Sleep"
                  type="monotone"
                  stroke={colors.coral}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: colors.coral }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="Age data exists, but no records match the filters." />
          )}
        </ChartCard>
      </div>
    </>
  )
}

function DataExplorer({ data, metadata }: { data: UsageRecord[]; metadata: ApiMetadata | null }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<keyof UsageRecord>('id')
  const [ascending, setAscending] = useState(true)
  const visible = useMemo(
    () =>
      data
        .filter((item) => Object.values(item).join(' ').toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
          const av = a[sort]
          const bv = b[sort]
          return (typeof av === 'number' ? av - Number(bv) : String(av).localeCompare(String(bv))) *
            (ascending ? 1 : -1)
        }),
    [data, search, sort, ascending],
  )
  const columns: { key: keyof UsageRecord; label: string }[] = [
    { key: 'id', label: 'ID' },
    { key: 'age', label: 'Age' },
    { key: 'gender', label: 'Gender' },
    { key: 'screenTime', label: 'Screen time' },
    { key: 'sleep', label: 'Sleep' },
    { key: 'stress', label: 'Stress' },
    { key: 'physicalActivity', label: 'Activity' },
    { key: 'addiction', label: 'Category' },
  ]
  const exportCsv = () => {
    const header = Object.keys(data[0] ?? {}).join(',')
    const rows = visible.map((item) => Object.values(item).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([`${header}\n${rows}`], { type: 'text/csv' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'smartphone-usage-data.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }
  const numericCount = metadata
    ? Object.values(metadata.column_types).filter((t) => /int|float|double/i.test(t)).length
    : 0
  const categoricalCount = metadata ? Object.values(metadata.column_types).length - numericCount : 0

  return (
    <div className="page-stack">
      <div className="summary-strip">
        <div><Database size={18} /><span><strong>{data.length} × {metadata?.columns ?? 0}</strong>Dataset dimensions</span></div>
        <div><ClipboardList size={18} /><span><strong>{metadata?.missing_total ?? 0}</strong>Missing values</span></div>
        <div><Table2 size={18} /><span><strong>{metadata?.duplicate_rows ?? 0}</strong>Duplicate rows</span></div>
        <div><Activity size={18} /><span><strong>{numericCount} numeric</strong>{categoricalCount} categorical</span></div>
      </div>
      <Card>
        <SectionHeader
          title="Data explorer"
          description="Search, inspect, and sort the currently filtered records."
          action={
            <Button className="primary-button" onClick={exportCsv}>
              <Download size={16} /> Export CSV
            </Button>
          }
        />
        <div className="table-tools">
          <label className="search-input">
            <Search size={16} />
            <input
              placeholder="Search any field..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <span>{visible.length} rows</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>
                    <button
                      onClick={() => {
                        if (sort === column.key) setAscending((value) => !value)
                        else {
                          setSort(column.key)
                          setAscending(true)
                        }
                      }}
                    >
                      {column.label}
                      <ChevronDown size={13} className={sort === column.key && !ascending ? 'rotate' : ''} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.slice(0, 20).map((item) => (
                <tr key={item.id}>
                  <td>#{String(item.id).padStart(3, '0')}</td>
                  <td>{item.age}</td>
                  <td>{item.gender}</td>
                  <td>{item.screenTime}h</td>
                  <td>{item.sleep}h</td>
                  <td>{item.stress.toFixed(1)}</td>
                  <td>{item.physicalActivity} h</td>
                  <td><span className={`status-pill ${item.addiction.toLowerCase()}`}>{item.addiction}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="two-column">
        <Card>
          <SectionHeader title="Column types" description="Inferred schema for the adapter." />
          <div className="definition-list">
            <div><code>screenTime</code><span>Number · hours/day</span></div>
            <div><code>sleep</code><span>Number · hours/night</span></div>
            <div><code>stress</code><span>Ordinal number · 1–10</span></div>
            <div><code>addiction</code><span>Recorded category · text</span></div>
          </div>
        </Card>
        <Card>
          <SectionHeader title="Numeric summary" description="Summary of records in the current view." />
          <div className="mini-stats">
            <div><span>Screen time mean</span><strong>{mean(data.map((x) => x.screenTime)).toFixed(2)}h</strong></div>
            <div><span>Screen time median</span><strong>{median(data.map((x) => x.screenTime)).toFixed(2)}h</strong></div>
            <div><span>Sleep mean</span><strong>{mean(data.map((x) => x.sleep)).toFixed(2)}h</strong></div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function StatisticalInsights({ data }: { data: UsageRecord[] }) {
  const metrics = [
    { name: 'Sleep duration', key: 'sleep' as const },
    { name: 'Stress level', key: 'stress' as const },
    { name: 'Physical activity', key: 'physicalActivity' as const },
    { name: 'Push notifications', key: 'notifications' as const },
  ].map((metric) => ({
    ...metric,
    r: correlation(data.map((item) => item.screenTime), data.map((item) => item[metric.key])),
  }))
  return (
    <div className="page-stack">
      <div className="insight-banner">
        <div className="banner-icon"><BarChart3 size={22} /></div>
        <div>
          <span>Exploratory statistical analysis</span>
          <strong>Associations, not predictions</strong>
          <p>All values below are recalculated from the current filtered illustrative sample.</p>
        </div>
      </div>
      <div className="two-column">
        <Card>
          <SectionHeader title="Pearson correlations" description="Association with daily screen time." />
          <div className="correlation-list">
            {metrics.map((metric) => (
              <div key={metric.name}>
                <span>{metric.name}</span>
                <div className="corr-track">
                  <i style={{ width: `${Math.abs(metric.r) * 100}%` }} className={metric.r < 0 ? 'negative' : ''} />
                </div>
                <strong>{metric.r.toFixed(2)}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionHeader title="Distribution summary" description="Daily screen time · hours." />
          <div className="stat-grid">
            <div><span>Minimum</span><strong>{Math.min(...data.map((x) => x.screenTime)).toFixed(1)}</strong></div>
            <div><span>Q1</span><strong>{quantile(data.map((x) => x.screenTime), .25).toFixed(1)}</strong></div>
            <div><span>Median</span><strong>{median(data.map((x) => x.screenTime)).toFixed(1)}</strong></div>
            <div><span>Q3</span><strong>{quantile(data.map((x) => x.screenTime), .75).toFixed(1)}</strong></div>
          </div>
        </Card>
      </div>
      <Card>
        <SectionHeader title="Methodology note" description="How to interpret this exploratory analysis." />
        <div className="methodology">
          <div><span>01</span><p><strong>Method selection</strong>Pearson correlation is shown because the illustrative numeric variables are continuous or scale-based. For ordinal or non-normal real data, use Spearman correlation.</p></div>
          <div><span>02</span><p><strong>Group comparisons</strong>Category summaries are descriptive. No statistical significance is claimed because no inferential test has been run.</p></div>
          <div><span>03</span><p><strong>Responsible interpretation</strong>Self-reported measures may contain recall and response bias. Association does not establish direction or causality.</p></div>
        </div>
      </Card>
    </div>
  )
}

function Findings({ data }: { data: UsageRecord[] }) {
  const screenSleep = correlation(data.map((x) => x.screenTime), data.map((x) => x.sleep))
  const screenStress = correlation(data.map((x) => x.screenTime), data.map((x) => x.stress))
  const cards = [
    {
      icon: Moon,
      title: 'Screen time and sleep move in opposite directions',
      stat: `r = ${screenSleep.toFixed(2)}`,
      text: 'In this illustrative sample, higher screen time is associated with shorter reported sleep.',
      action: 'Use device wind-down settings to make evening habits more visible.',
      tone: 'indigo',
    },
    {
      icon: Bell,
      title: 'Screen time is associated with stress',
      stat: `r = ${screenStress.toFixed(2)}`,
      text: 'The filtered sample shows a positive descriptive relationship, without establishing cause.',
      action: 'Batch non-essential notifications during study and work blocks.',
      tone: 'amber',
    },
    {
      icon: Activity,
      title: 'Balance screen time with movement',
      stat: `${mean(data.map((x) => x.physicalActivity)).toFixed(0)} min`,
      text: 'Average daily physical activity provides context for interpreting overall digital routines.',
      action: 'Schedule short movement breaks between longer sessions.',
      tone: 'green',
    },
  ]
  return (
    <div className="page-stack">
      <div className="recommendation-grid">
        {cards.map((item) => (
          <Card className="recommendation-card" key={item.title}>
            <div className={`recommendation-icon ${item.tone}`}><item.icon size={20} /></div>
            <div className="finding-label">Observed finding</div>
            <h3>{item.title}</h3>
            <div className="finding-stat">{item.stat}</div>
            <p>{item.text}</p>
            <div className="recommendation">
              <Target size={16} />
              <span><strong>Practical consideration</strong>{item.action}</span>
            </div>
          </Card>
        ))}
      </div>
      <div className="caution-note">
        <Info size={18} />
        <p><strong>Interpret with care</strong>These recommendations support awareness only. They are not medical guidance, diagnoses, or evidence of causal health effects.</p>
      </div>
    </div>
  )
}

function SdgImpact() {
  return (
    <div className="page-stack">
      <div className="sdg-grid">
        <Card className="sdg-card sdg-three">
          <div className="sdg-number">3</div>
          <div className="sdg-content">
            <div className="sdg-kicker">Primary alignment</div>
            <h2>Good Health and Well-being</h2>
            <p>Exploring digital habits alongside sleep and stress can support awareness of personal digital well-being patterns.</p>
            <div className="sdg-tags"><span>Sleep awareness</span><span>Digital habits</span><span>Well-being</span></div>
          </div>
        </Card>
        <Card className="sdg-card sdg-four">
          <div className="sdg-number">4</div>
          <div className="sdg-content">
            <div className="sdg-kicker">Secondary alignment</div>
            <h2>Quality Education</h2>
            <p>The dataset includes physical activity and usage metrics, enabling cautious exploration of study routines and focused work habits.</p>
            <div className="sdg-tags"><span>Study routines</span><span>Focus</span><span>Physical activity</span></div>
          </div>
        </Card>
      </div>
      <Card>
        <SectionHeader title="Scope of contribution" description="What this academic project can and cannot demonstrate." />
        <div className="scope-grid">
          <div className="scope-item positive"><strong>Supports</strong><p>Data literacy, pattern awareness, responsible interpretation, and informed discussion.</p></div>
          <div className="scope-item neutral"><strong>Does not prove</strong><p>Health effects, causal mechanisms, clinical outcomes, or direct achievement of SDG targets.</p></div>
        </div>
      </Card>
    </div>
  )
}

function AboutProject() {
  const sections = [
    ['Problem statement', 'How do smartphone usage patterns relate to sleep, stress, activity, and self-reported addiction categories?'],
    ['Motivation', 'To make everyday digital behavior visible through careful descriptive analytics and accessible visual storytelling.'],
    ['Objectives', 'Describe usage, compare groups, explore correlations, communicate limitations, and support evidence-aware reflection.'],
    ['Dataset source', 'Real dataset connected: mobile_addiction_data.csv with 3,000 records and 34 columns.'],
    ['Data cleaning', 'Planned checks include types, ranges, missingness, duplicate rows, category normalization, and unit consistency.'],
    ['Feature engineering', 'Age groups and screen-time bins are derived for comparison. Original variables remain available.'],
    ['Methods', 'Descriptive statistics, distributions, grouped summaries, Pearson/Spearman correlations, and conditional hypothesis tests.'],
    ['Limitations', 'Self-report bias, sampling bias, cross-sectional design, unmeasured confounding, and no basis for causal claims.'],
  ]
  return (
    <div className="page-stack">
      <Card className="about-hero">
        <div className="about-mark"><Smartphone size={30} /></div>
        <div>
          <div className="eyebrow">Academic analytics project</div>
          <h2>Smartphone Usage Analysis</h2>
          <p>Exploring digital habits, lifestyle, and self-reported smartphone addiction through descriptive and exploratory analysis.</p>
        </div>
      </Card>
      <div className="about-grid">
        {sections.map(([title, text], index) => (
          <Card className="about-item" key={title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </Card>
        ))}
      </div>
      <Card>
        <SectionHeader title="Team & responsibilities" description="Replace these roles with project team details." />
        <div className="team-row">
          <div><span>DA</span><p><strong>Data analyst</strong>Cleaning & EDA</p></div>
          <div><span>SR</span><p><strong>Statistics reviewer</strong>Methods & interpretation</p></div>
          <div><span>UX</span><p><strong>Dashboard designer</strong>Visual storytelling</p></div>
        </div>
      </Card>
    </div>
  )
}

function LifestylePage({ data, mode }: { data: UsageRecord[]; mode: 'usage' | 'lifestyle' }) {
  const activity = [
    { name: 'Social media', value: mean(data.map((x) => x.socialMedia)), fill: colors.teal },
    { name: 'Gaming', value: mean(data.map((x) => x.gaming)), fill: colors.amber },
    { name: 'Other apps', value: mean(data.map((x) => x.otherApps)), fill: colors.green },
  ]
  return (
    <div className="two-column">
      <ChartCard
        title={mode === 'usage' ? 'Average activity mix' : 'Lifestyle metric profile'}
        subtitle={mode === 'usage' ? 'Share of daily screen activity' : 'Normalized descriptive averages'}
      >
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie data={activity} dataKey="value" nameKey="name" innerRadius={70} outerRadius={105} paddingAngle={3}>
              {activity.map((x) => <Cell key={x.name} fill={x.fill} />)}
            </Pie>
            <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => `${Number(value).toFixed(1)}h`} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      <Card>
        <SectionHeader
          title={mode === 'usage' ? 'Usage pattern notes' : 'Lifestyle context'}
          description="Descriptive observations from the current view."
        />
        <div className="observation-list">
          <div><span>01</span><p><strong>{mean(data.map((x) => x.screenTime)).toFixed(1)} hours</strong>Average daily screen time</p></div>
          <div><span>02</span><p><strong>{mean(data.map((x) => x.sleep)).toFixed(1)} hours</strong>Average nightly sleep</p></div>
          <div><span>03</span><p><strong>{mean(data.map((x) => x.notifications)).toFixed(0)}</strong>Average daily notifications</p></div>
          <div><span>04</span><p><strong>{mean(data.map((x) => x.physicalActivity)).toFixed(1)} h</strong>Average daily physical activity</p></div>
        </div>
      </Card>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('Overview')
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [allData, setAllData] = useState<UsageRecord[]>([])
  const [metadata, setMetadata] = useState<ApiMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([fetchRecords(), fetchMetadata()])
      .then(([recordsResponse, meta]) => {
        if (cancelled) return
        setAllData(recordsResponse.records.map(mapRecord))
        setMetadata(meta)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load data from the backend.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const data = useMemo(
    () =>
      allData.filter((item) => {
        if (filters.age !== 'All ages' && ageGroup(item.age) !== filters.age) return false
        if (filters.gender !== 'All genders' && item.gender !== filters.gender) return false
        if (filters.addiction !== 'All categories' && item.addiction !== filters.addiction) return false
        if (filters.maxScreen < item.screenTime) return false
        if (filters.stress === 'Low (0-33)' && item.stress > 33) return false
        if (filters.stress === 'Moderate (34-66)' && (item.stress < 34 || item.stress > 66)) return false
        if (filters.stress === 'High (67-100)' && item.stress < 67) return false
        return true
      }),
    [allData, filters],
  )
  const pageMeta: Record<Page, [string, string]> = {
    Overview: ['Smartphone Usage Overview', 'Understand digital habits, lifestyle patterns, and well-being.'],
    'Data Explorer': ['Data Explorer', 'Inspect the structure, quality, and records behind the analysis.'],
    'Usage Patterns': ['Usage Patterns', 'Explore how daily smartphone activity is distributed.'],
    'Lifestyle Analysis': ['Lifestyle Analysis', 'Compare digital habits with sleep, activity, and stress.'],
    'Statistical Insights': ['Statistical Insights', 'Evaluate descriptive relationships with transparent methods.'],
    'Findings & Recommendations': ['Findings & Recommendations', 'Turn observed patterns into cautious, practical considerations.'],
    'SDG Impact': ['Sustainable Development Goals', 'Connect responsible digital well-being analysis to global goals.'],
    'About Project': ['About the Project', 'Review the purpose, methods, data plan, and limitations.'],
  }

  const content = {
    Overview: <Overview data={data} />,
    'Data Explorer': <DataExplorer data={data} metadata={metadata} />,
    'Usage Patterns': <LifestylePage data={data} mode="usage" />,
    'Lifestyle Analysis': <LifestylePage data={data} mode="lifestyle" />,
    'Statistical Insights': <StatisticalInsights data={data} />,
    'Findings & Recommendations': <Findings data={data} />,
    'SDG Impact': <SdgImpact />,
    'About Project': <AboutProject />,
  }[page]

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Activity size={21} /></div>
          <div><strong>DigitalWell</strong><span>Analytics</span></div>
          <Button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)}><X size={18} /></Button>
        </div>
        <nav>
          <span className="nav-label">Workspace</span>
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={page === label ? 'active' : ''}
              onClick={() => {
                setPage(label)
                setSidebarOpen(false)
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-status">
          <span><i /> Dataset status</span>
          <strong>Connected</strong>
          <p>3,000 records</p>
        </div>
        <div className="sidebar-footer">
          <div className="avatar">AU</div>
          <div><strong>Analytics Project</strong><span>University demo</span></div>
        </div>
      </aside>

      {sidebarOpen && <button className="overlay" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      <main className="main">
        <header className="topbar">
          <Button className="icon-button menu-button" onClick={() => setSidebarOpen(true)}><Menu size={19} /></Button>
          <div className="breadcrumbs"><span>DigitalWell Analytics</span><i>/</i><strong>{page}</strong></div>
          <div className="top-actions">
            <span className="source-chip"><Database size={14} /> Source: mobile_addiction_data.csv</span>
            <Button className="icon-button" aria-label="Project information"><Info size={17} /></Button>
          </div>
        </header>
        <div className="content-shell">
          <div className="page-header">
            <div>
              <div className="eyebrow">Smartphone usage analysis</div>
              <h1>{pageMeta[page][0]}</h1>
              <p>{pageMeta[page][1]}</p>
            </div>
            <div className="header-actions">
              <div className="sample-badge"><span>Real data</span><strong>3,000 records</strong></div>
              <Button className="filter-toggle" onClick={() => setFiltersOpen(true)}>
                <SlidersHorizontal size={16} /> Filters
              </Button>
            </div>
          </div>
          <div className="data-notice">
            <Info size={15} />
            <span><strong>Real dataset connected.</strong> 3,000 records from mobile_addiction_data.csv; 612 missing education values.</span>
          </div>
          <div className="workspace">
            <div className="page-content">
              {loading ? (
                <Card><SectionHeader title="Loading data" description="Connecting to the smartphone usage API." /></Card>
              ) : error ? (
                <Card>
                  <SectionHeader title="Data unavailable" description={error} />
                  <Button className="primary-button" onClick={() => setReloadToken((value) => value + 1)}>Retry</Button>
                </Card>
              ) : (
                content
              )}
            </div>
            {page !== 'About Project' && page !== 'SDG Impact' && (
              <FiltersPanel
                filters={filters}
                setFilters={setFilters}
                filteredCount={data.length}
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
