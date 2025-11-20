import { Sun, Moon } from "lucide-react";
import useThemeStore from "../../store/themeStore";
import { Button } from "../ui/button";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="small"
      className="p-2 rounded-md border hover:bg-muted"
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </Button>
  );
}
