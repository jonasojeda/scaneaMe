import React from 'react'
import { Link } from 'react-router-dom'
import primaverVerano from '../../Logo/verano.jpeg'
import otoñoInvierno from '../../Logo/invierno.jpeg'
import styles from './SeasonalBanner.module.css'


export default function SeasonalBanner() {
  return (
    <div className={styles.container}>
      <Link to={"/catalogue"}

      
      
      state={{
          filter:'season',
          value:'spring',
          valor:'Primavera / Verano'
          }}

      className={styles.primaveraLink}>
      <img
        src={primaverVerano}
        className={styles.primaveraImg}
        alt='Spring summer catalogue'
      />
      </Link>
      <Link to={"/catalogue"} 
      
      state={{
        filter:'season',
        value:'fall',
        valor:'Otoño / Invierno'}}
      
      className={styles.otoñoLink}>
      <img
        src={otoñoInvierno}
        className={styles.otoñoImg}
        alt='Fall winter catalogue'
      />
      </Link>
    </div>
  )
}
