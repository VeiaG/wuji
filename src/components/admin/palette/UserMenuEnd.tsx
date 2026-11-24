'use client'

import React, { useState } from 'react'
import {
  ChevronIcon,
  LogOutIcon,
  Popup,
  PopupList,
  useConfig,
  useTranslation,
  useWindowInfo,
} from '@payloadcms/ui'
import { formatAdminURL } from 'payload/shared'
import { palettes } from '@/lib/palettes'
import { usePalette } from './PaletteProvider'
import './palette.css'

const baseClass = 'palette-menu'

const PaletteIcon = () => (
  <span aria-hidden className={`${baseClass}__icon`}>
    <span className={`${baseClass}__swatch ${baseClass}__swatch--current`} />
  </span>
)

/** Варіанти палітр — як нативний ThemeMenuContent: радіогрупа, меню не закривається */
const PaletteOptions = () => {
  const { palette, setPalette } = usePalette()
  return (
    <div data-popup-prevent-close>
      <PopupList.RadioGroup>
        {palettes.map((option) => (
          <PopupList.RadioGroupItem
            active={palette === option.id}
            key={option.id}
            onClick={() => setPalette(option.id)}
          >
            <span className={`${baseClass}__option`}>
              <span
                aria-hidden
                className={`${baseClass}__swatch`}
                style={{ background: option.accent }}
              />
              {option.label}
            </span>
          </PopupList.RadioGroupItem>
        ))}
      </PopupList.RadioGroup>
    </div>
  )
}

/**
 * Пункт «Палітра» в меню користувача: на десктопі — підменю при наведенні, як нативний
 * «Theme»; на телефоні — розгортається на місці (нативне мобільне підменю керується
 * внутрішнім станом UserMenu, до якого ззовні не дістатися).
 */
const PaletteMenu = () => {
  const {
    breakpoints: { s: isMobile },
  } = useWindowInfo()
  const [open, setOpen] = useState(false)

  if (isMobile) {
    return (
      <>
        <button
          aria-expanded={open}
          className="popup-button-list__button popup-button-list__button--submenu-trigger"
          data-popup-prevent-close
          onClick={() => setOpen((v) => !v)}
          role="menuitem"
          tabIndex={-1}
          type="button"
        >
          <span className="popup-button-list__submenu-icon">
            <PaletteIcon />
          </span>
          <span className="popup-button-list__label">Палітра</span>
          <span className="popup-button-list__chevron">
            <ChevronIcon direction={open ? 'down' : 'right'} size={24} />
          </span>
        </button>
        {open && <PaletteOptions />}
      </>
    )
  }

  return (
    <Popup
      hoverSubmenu
      popupType="menu"
      renderButton={(buttonProps) => (
        <PopupList.SubmenuTrigger
          buttonProps={buttonProps}
          icon={<PaletteIcon />}
          trailingIcon={<ChevronIcon direction="right" size={16} />}
        >
          Палітра
        </PopupList.SubmenuTrigger>
      )}
      side="left"
      size="large"
      theme="dark"
    >
      <PaletteOptions />
    </Popup>
  )
}

/**
 * Останні рядки меню користувача (`admin.components.logout.Button`): «Палітра», роздільник,
 * «Вийти».
 *
 * UserMenu Payload приймає додаткові рядки лише всередині свого підменю Settings, тож
 * верхній рівень доступний тільки через слот кнопки виходу: Payload кладе компонент в
 * останній рядок як є. Тому вихід малюємо самі, як нативний (той самий прийом, що в PW).
 *
 * @todo Замінити на нормальний слот верхнього рівня, якщо Payload його додасть.
 */
export function UserMenuEnd() {
  const { t } = useTranslation()
  const {
    config: {
      admin: {
        routes: { logout },
      },
      routes: { admin: adminRoute },
    },
  } = useConfig()

  return (
    <>
      <PaletteMenu />
      <hr className="popup-divider" />
      <PopupList.Button href={formatAdminURL({ adminRoute, path: logout })} icon={<LogOutIcon />}>
        {t('authentication:logOut')}
      </PopupList.Button>
    </>
  )
}
