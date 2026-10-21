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

const formatPrice = (price) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0
    }).format(price || 0);

const CHART_COLORS = ["#c9a45c", "#d8b574", "#e5cd97", "#a8874a"];

const tooltipStyle = {
    background: "#171a20",
    border: "1px solid #2a2d33",
    borderRadius: "8px",
    color: "#f4efe6"
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
        status,
        count
    }));

    return (
        <main className="admin-page">
            <header className="admin-header-bar">
                <div>
                    <Link to="/" className="logo">AUREO</Link>
                    <span className="admin-tag">ADMIN VAULT</span>
                </div>
                <div className="admin-nav-actions">
                    <Link to="/admin/products" className="outline-button">Inventory</Link>
                    <Link to="/admin/orders" className="outline-button">Orders</Link>
                    <Link to="/admin/services" className="outline-button">Services</Link>
                    <Link to="/admin/tickets" className="outline-button">Tickets</Link>
                    <Link to="/me" className="nav-action">Account</Link>
                </div>
            </header>

            <div className="admin-container">
                <div className="admin-page-title-row">
                    <div>
                        <p className="eyebrow">PERFORMANCE</p>
                        <h1>Vault Dashboard</h1>
                    </div>

                    <div className="dashboard-filters">
                        <input
                            type="date"
                            name="from"
                            value={range.from}
                            onChange={handleRangeChange}
                            className="catalog-input"
                            aria-label="From date"
                        />
                        <span className="date-separator">to</span>
                        <input
                            type="date"
                            name="to"
                            value={range.to}
                            onChange={handleRangeChange}
                            className="catalog-input"
                            aria-label="To date"
                        />
                        <select
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value)}
                            className="catalog-select"
                            aria-label="Chart type"
                        >
                            <option value="bar">Bar chart</option>
                            <option value="line">Line chart</option>
                        </select>
                    </div>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {loading && <p className="catalog-message">Crunching the numbers...</p>}

                <div className="metric-grid">
                    <article className="metric-card">
                        <span className="metric-label">Total sales</span>
                        <strong className="metric-value">{formatPrice(sales)}</strong>
                        <span className="metric-hint">Paid, shipped and completed orders</span>
                    </article>

                    <article className="metric-card">
                        <span className="metric-label">Expenses</span>
                        <strong className="metric-value">{formatPrice(expenses)}</strong>
                        <span className="metric-hint">Accepted appraisal offers</span>
                    </article>

                    <article className="metric-card">
                        <span className="metric-label">Net</span>
                        <strong className="metric-value">{formatPrice(profit)}</strong>
                        <span className="metric-hint">Sales minus expenses</span>
                    </article>

                    <article className="metric-card">
                        <span className="metric-label">Inventory</span>
                        <strong className="metric-value">{inventory?.totalUnits ?? 0}</strong>
                        <span className="metric-hint">
                            {inventory?.inStock ?? 0} listed piece(s) in stock
                        </span>
                    </article>
                </div>

                <div className="dashboard-charts">
                    <section className="chart-card">
                        <h2>Sales over time</h2>
                        {monthlySales && monthlySales.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                {chartType === "bar" ? (
                                    <BarChart data={monthlySales}>
                                        <CartesianGrid stroke="#2a2d33" vertical={false} />
                                        <XAxis dataKey="month" stroke="#b8b2a6" fontSize={12} />
                                        <YAxis stroke="#b8b2a6" fontSize={12} tickFormatter={(value) => value / 1000} />
                                        <Tooltip
                                            contentStyle={tooltipStyle}
                                            formatter={(value) => formatPrice(value)}
                                        />
                                        <Legend wrapperStyle={{ color: "#b8b2a6" }} />
                                        <Bar dataKey="total" name="Sales" fill="#c9a45c" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                ) : (
                                    <LineChart data={monthlySales}>
                                        <CartesianGrid stroke="#2a2d33" vertical={false} />
                                        <XAxis dataKey="month" stroke="#b8b2a6" fontSize={12} />
                                        <YAxis stroke="#b8b2a6" fontSize={12} tickFormatter={(value) => value / 1000} />
                                        <Tooltip
                                            contentStyle={tooltipStyle}
                                            formatter={(value) => formatPrice(value)}
                                        />
                                        <Legend wrapperStyle={{ color: "#b8b2a6" }} />
                                        <Line
                                            type="monotone"
                                            dataKey="total"
                                            name="Sales"
                                            stroke="#c9a45c"
                                            strokeWidth={2}
                                            dot={{ fill: "#c9a45c", r: 4 }}
                                        />
                                    </LineChart>
                                )}
                            </ResponsiveContainer>
                        ) : (
                            <p className="catalog-message">
                                No sales in the selected range.
                            </p>
                        )}
                    </section>

                    <section className="chart-card">
                        <h2>Orders by status</h2>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={orderBars}>
                                <CartesianGrid stroke="#2a2d33" vertical={false} />
                                <XAxis dataKey="status" stroke="#b8b2a6" fontSize={12} />
                                <YAxis stroke="#b8b2a6" fontSize={12} allowDecimals={false} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Bar dataKey="count" name="Orders">
                                    {orderBars.map((entry, index) => (
                                        <Cell key={entry.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </section>
                </div>

                <section className="chart-card">
                    <h2>Inventory breakdown</h2>
                    <div className="inventory-grid">
                        <div>
                            <span>Active listings</span>
                            <strong>{inventory?.totalProducts ?? 0}</strong>
                        </div>
                        <div>
                            <span>Brand new</span>
                            <strong>{inventory?.newWatches ?? 0}</strong>
                        </div>
                        <div>
                            <span>Second-hand</span>
                            <strong>{inventory?.secondHandWatches ?? 0}</strong>
                        </div>
                        <div>
                            <span>Total units in stock</span>
                            <strong>{inventory?.totalUnits ?? 0}</strong>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default AdminDashboardPage;
