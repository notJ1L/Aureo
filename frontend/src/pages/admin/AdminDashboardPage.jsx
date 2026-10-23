import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { getDashboard } from "../../redux/actions/serviceActions";
import AdminHeader from "../../components/layout/AdminHeader";
import {
    IconBox,
    IconScale,
    IconTrendUp,
    IconWallet
} from "../../components/layout/icons";
import "../../styles/admin.css";

const formatPrice = (price) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0
    }).format(price || 0);

const CHART_COLORS = ["#e2bb76", "#d9b36c", "#c9a45c", "#a8874a", "#f6e3b0"];

const customTooltipStyle = {
    background: "rgba(13, 15, 20, 0.94)",
    border: "1px solid rgba(226, 187, 118, 0.35)",
    borderRadius: "10px",
    color: "#f5f0e6",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8)",
    padding: "0.8rem 1.2rem",
    fontSize: "0.82rem"
};

function AdminDashboardPage() {
    const dispatch = useDispatch();
    const { loading, error, sales, expenses, profit, orderCounts, inventory, monthlySales } =
        useSelector((state) => state.dashboard);

    const [range, setRange] = useState({ from: "", to: "" });
    const [chartType, setChartType] = useState("bar");

    useEffect(() => {
        const params = {};
        if (range.from) params.from = range.from;
        if (range.to) params.to = range.to;

        dispatch(getDashboard(params));
    }, [dispatch, range]);

    const handleRangeChange = (event) => {
        setRange((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    };

    const orderBars = Object.entries(orderCounts || {}).map(([status, count]) => ({
        status: status.toUpperCase(),
        count
    }));

    return (
        <main className="admin-vault-page">
            <AdminHeader />

            <div className="admin-vault-container">
                {/* Title & Filter Bar */}
                <div className="admin-title-panel">
                    <div>
                        <p className="lx-kicker">EXECUTIVE ANALYTICS</p>
                        <h1>Vault Intelligence &amp; Performance</h1>
                    </div>

                    <div className="admin-toolbar-row">
                        <input
                            type="date"
                            name="from"
                            value={range.from}
                            onChange={handleRangeChange}
                            className="admin-date-input"
                            aria-label="From date"
                        />
                        <span className="admin-date-sep">to</span>
                        <input
                            type="date"
                            name="to"
                            value={range.to}
                            onChange={handleRangeChange}
                            className="admin-date-input"
                            aria-label="To date"
                        />
                        <select
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value)}
                            className="admin-select-input"
                            aria-label="Chart type"
                        >
                            <option value="bar">Bar Chart</option>
                            <option value="line">Line Chart</option>
                        </select>
                    </div>
                </div>

                {error && <div className="auth-error" style={{ marginBottom: "1.5rem" }}>{error}</div>}
                {loading && <p className="catalog-message">Auditing vault transaction logs...</p>}

                {/* 4 Metric Cards */}
                <div className="vault-metrics-grid">
                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Total Gross Revenue</span>
                            <div className="vault-metric-icon"><IconTrendUp /></div>
                        </div>
                        <div className="vault-metric-val">{formatPrice(sales)}</div>
                        <span className="vault-metric-hint">Settled, shipped and completed watch acquisitions</span>
                    </article>

                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Appraisal Outlay</span>
                            <div className="vault-metric-icon"><IconScale /></div>
                        </div>
                        <div className="vault-metric-val">{formatPrice(expenses)}</div>
                        <span className="vault-metric-hint">Capital disbursed for accepted consignment offers</span>
                    </article>

                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Net Vault Margin</span>
                            <div className="vault-metric-icon"><IconWallet /></div>
                        </div>
                        <div className="vault-metric-val">{formatPrice(profit)}</div>
                        <span className="vault-metric-hint">Gross acquisitions minus seller payouts</span>
                    </article>

                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Vault Inventory</span>
                            <div className="vault-metric-icon"><IconBox /></div>
                        </div>
                        <div className="vault-metric-val">{inventory?.totalUnits ?? 0} <small style={{ fontSize: "1rem", color: "var(--text-muted)" }}>Units</small></div>
                        <span className="vault-metric-hint">{inventory?.inStock ?? 0} active chronometers ready for courier</span>
                    </article>
                </div>

                {/* Charts Area */}
                <div className="vault-charts-grid">
                    <section className="vault-chart-panel">
                        <div className="vault-chart-panel-head">
                            <h2>Sales Trajectory Over Time</h2>
                            <span className="vault-chart-tag">Monthly Settlement Trend</span>
                        </div>

                        {monthlySales && monthlySales.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                {chartType === "bar" ? (
                                    <BarChart data={monthlySales}>
                                        <defs>
                                            <linearGradient id="goldBarGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#f6e3b0" stopOpacity={0.9} />
                                                <stop offset="100%" stopColor="#a37b3a" stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="rgba(244, 239, 230, 0.06)" vertical={false} />
                                        <XAxis dataKey="month" stroke="#7d786e" fontSize={11} tickLine={false} />
                                        <YAxis
                                            stroke="#7d786e"
                                            fontSize={11}
                                            tickLine={false}
                                            tickFormatter={(val) => `₱${(val / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip
                                            contentStyle={customTooltipStyle}
                                            formatter={(value) => [formatPrice(value), "Settled Sales"]}
                                        />
                                        <Legend wrapperStyle={{ color: "#b8b2a6", fontSize: 12 }} />
                                        <Bar dataKey="total" name="Sales Revenue" fill="url(#goldBarGrad)" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                ) : (
                                    <LineChart data={monthlySales}>
                                        <CartesianGrid stroke="rgba(244, 239, 230, 0.06)" vertical={false} />
                                        <XAxis dataKey="month" stroke="#7d786e" fontSize={11} tickLine={false} />
                                        <YAxis
                                            stroke="#7d786e"
                                            fontSize={11}
                                            tickLine={false}
                                            tickFormatter={(val) => `₱${(val / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip
                                            contentStyle={customTooltipStyle}
                                            formatter={(value) => [formatPrice(value), "Settled Sales"]}
                                        />
                                        <Legend wrapperStyle={{ color: "#b8b2a6", fontSize: 12 }} />
                                        <Line
                                            type="monotone"
                                            dataKey="total"
                                            name="Sales Revenue"
                                            stroke="#e2bb76"
                                            strokeWidth={3}
                                            dot={{ fill: "#f6e3b0", r: 5, strokeWidth: 2, stroke: "#12151a" }}
                                            activeDot={{ r: 7, fill: "#fff" }}
                                        />
                                    </LineChart>
                                )}
                            </ResponsiveContainer>
                        ) : (
                            <p className="catalog-message">No sales recorded within the specified period.</p>
                        )}
                    </section>

                    <section className="vault-chart-panel">
                        <div className="vault-chart-panel-head">
                            <h2>Orders by Fulfillment Status</h2>
                            <span className="vault-chart-tag">Pipeline Distribution</span>
                        </div>

                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={orderBars}>
                                <CartesianGrid stroke="rgba(244, 239, 230, 0.06)" vertical={false} />
                                <XAxis dataKey="status" stroke="#7d786e" fontSize={11} tickLine={false} />
                                <YAxis stroke="#7d786e" fontSize={11} allowDecimals={false} tickLine={false} />
                                <Tooltip contentStyle={customTooltipStyle} />
                                <Bar dataKey="count" name="Order Volume" radius={[6, 6, 0, 0]}>
                                    {orderBars.map((entry, index) => (
                                        <Cell
                                            key={entry.status}
                                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </section>
                </div>

                {/* Inventory Breakdown */}
                <section className="vault-inventory-panel">
                    <h2>Vault Inventory Composition</h2>
                    <div className="vault-inventory-grid">
                        <div className="vault-inventory-box">
                            <span>Cataloged Models</span>
                            <strong>{inventory?.totalProducts ?? 0}</strong>
                        </div>
                        <div className="vault-inventory-box">
                            <span>Factory Sealed New</span>
                            <strong>{inventory?.newWatches ?? 0}</strong>
                        </div>
                        <div className="vault-inventory-box">
                            <span>Certified Pre-Owned</span>
                            <strong>{inventory?.secondHandWatches ?? 0}</strong>
                        </div>
                        <div className="vault-inventory-box">
                            <span>Total Units in Vault</span>
                            <strong>{inventory?.totalUnits ?? 0}</strong>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default AdminDashboardPage;
