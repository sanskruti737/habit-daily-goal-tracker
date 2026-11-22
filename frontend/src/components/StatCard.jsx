import Icon from './Icon.jsx';

export default function StatCard({ icon, label, value, detail, tone = 'indigo' }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__icon">
        <Icon name={icon} size={20} />
      </div>
      <div className="stat-card__content">
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        <p className="stat-card__detail">{detail}</p>
      </div>
    </article>
  );
}
