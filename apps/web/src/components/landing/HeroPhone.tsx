import './HeroPhone.css';

export function HeroPhone() {
  return (
    <div className="hero-phone-container">
      <div className="phone-wrapper">
        <div className="iphone-frame">
          <div className="side-button volume-up" />
          <div className="side-button volume-down" />
          <div className="side-button silent-switch" />
          <div className="side-button power-button" />

          <div className="screen-bezel">
            <img
              src="/phone-screenshot.jpg"
              alt="mrblu app — tap to record voice and create invoices"
              className="screen-image"
              loading="eager"
              draggable={false}
            />
          </div>
        </div>

        <div className="phone-shadow" />
      </div>
    </div>
  );
}
