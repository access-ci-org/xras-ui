import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectSelectedCategory, setSelectedCategory } from "./helpers/catalogSlice";
import Dropdown from 'react-bootstrap/Dropdown';
import NavItem from 'react-bootstrap/NavItem';
import NavLink from 'react-bootstrap/NavLink';

const Nav = () => {
  const dispatch = useDispatch();
  const selectedCategory = useSelector( selectSelectedCategory );

  const menuItems = [
    {"CPU": (<><i className="bi bi-cpu"></i> CPU</>)},
    {"GPU": (<><i className="bi bi-gpu-card"></i> GPU</>)},
    {"Innovative": (<><i className="bi bi-lightbulb"></i> Innovative</>)},
    {"Cloud": (<><i className="bi bi-cloud"></i> Cloud</>)},
    {"Storage": (<><i className="bi bi-hdd-fill"></i> Storage</>)},
  ]

  const dd =  (
    <Dropdown as={NavItem}>
      <Dropdown.Toggle as={NavLink}>Click to see more…</Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item>Hello there!</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );

  const activeStyles = {
    backgroundColor: "rgb(26, 91, 110)",
    color: "#fff"
  }

  const regularStyles = {
    color: "#000"
  }

  const setCategory = (category) => {
    dispatch( setSelectedCategory(category) );
  }

  const renderItem = (item) => {
    const key = Object.keys(item)[0];
    const label = item[key];
    const styles = key == selectedCategory ? activeStyles : regularStyles;

    return (
      <li className="nav-item" key={`menu_${key}`}>
        <button
          role="button"
          className="nav-link"
          style={styles}
          onClick={() => setCategory(key)}
        >
          {label}
        </button>
      </li>
    )
  }

  return (
    <ul className="nav nav-pills ms-3">
      {menuItems.map((item) => renderItem(item))}
      { dd }
    </ul>
  )
}

export default Nav;