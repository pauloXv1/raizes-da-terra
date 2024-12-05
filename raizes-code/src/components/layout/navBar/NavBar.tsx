import React from "react"
import styles from "./NavBar.module.css";
import {Link} from "react-router-dom";
import Logo from "../../../assets/image/logo.png"

function NavBar (){
    return(
        <header>
            <nav className={styles.navBar}>
                <Link to="/">
                    <img className={styles.logo} src={Logo} alt="raizes da terra" />
                </Link>
                <Link to="/">home</Link>
                <Link to="/">pedido</Link>
                <Link to="/">sobre</Link>
                <Link to="/">contato</Link>
            </nav>
        </header>
    )
}
export default NavBar;