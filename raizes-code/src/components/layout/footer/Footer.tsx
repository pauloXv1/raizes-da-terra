import {FaFacebook, FaInstagram} from "react-icons/fa"
import styles from "./Footer.module.css";
function Footer(){
    return(
        <footer className={styles.footer}>
            <ul>
                <li>
                    <FaFacebook/>
                </li>
                <li>
                    <FaInstagram/>
                </li>
            </ul>
        </footer>
    )
}
export default Footer;