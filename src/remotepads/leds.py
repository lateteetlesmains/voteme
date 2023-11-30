from typing import List


try:
    import board
    import neopixel
except:
    print("erreur import création de fausses classes (seulement pour du debug)")

    class board:
        D18 = 0

    class pixels:
        def fill(somearg):
            pass

    class neopixel(List):
        def __init__(self, pin, numpix) -> None:
            self.pixels = pixels()
            for i in range(0, numpix):
                self.append(i)

        def fill(self, somearg):
            pass


from time import sleep


class Color:
    def __init__(self, name, r, g, b) -> None:
        self.name = name
        self.r = r
        self.g = g
        self.b = b

    def color(self):
        return (self.r, self.g, self.b)


class Colors:
    Black = Color("Black", 0, 0, 0)
    Red = Color("Red", 255, 0, 0)
    Green = Color("Green", 0, 255, 0)
    Blue = Color("Blue", 0, 0, 255)
    Purple = Color("Purple", 255, 0, 255)
    Orange = Color("Orange", 255, 127, 0)
    Yellow = Color("Yellow", 255, 255, 0)
    RedRuby = Color("RedRuby", 163, 0, 21)
    BlueLavender = Color("BlueLavender", 177, 145, 255)
    Turquoise = Color("Turquoise", 65, 234, 212)
    PurpleDark = Color("PurpleDark", 94, 35, 157)


class Display:
    def __init__(self, pin, numpix) -> None:
        try:
            self.pixels = neopixel.NeoPixel(pin, numpix)
        except:
            self.pixels = neopixel(pin, numpix)

        self.texts = {
            '.': [6],
            'p': [1, 2, 3],
            'o': [0, 1, 2, 3, 4, 5],
            'u': [1, 2, 3, 4, 5],
            't': [3, 4, 5, 6],
            '0': [0, 1, 2, 3, 4, 5],
            '1': [1, 2],
            '2': [0, 1, 3, 4, 6],
            '3': [0, 1, 2, 3, 6],
            '4': [1, 2, 5, 6],
            '5': [0, 2, 3, 5, 6],
            '6': [0, 2, 3, 4, 5, 6],
            '7': [0, 1, 2],
            '8': [0, 1, 2, 3, 4, 5, 6],
            '9': [0, 1, 2, 3, 5, 6]

        }

    def __format(self, text):

        outList = []
        if not str(text).isnumeric():
            return [self.texts[txt] for txt in str(text) if txt in self.texts]
            # return [self.texts[text]]

        for nb in str(text):
            outList.append(self.texts[nb])
        return outList

    def draw(self, screen, text, color):

        screens = {
            1: (0, 1, 2, 3, 4, 5, 6),
            2: (7, 8, 9, 10, 11, 12, 13),
            3: (14, 15, 16, 17, 18, 19, 20),
            4: (21, 22, 23, 24, 25, 26, 27),
            5: (28, 29, 30, 31, 32, 33, 34)
        }

        formatted_text = self.__format(text)
        screen_offset = screen
        if len(formatted_text) > len(screens):
            print("Pas de place")
            self.draw(2, 'out', Color.Red)
            return
        if screen + len(formatted_text) > len(screens):
            screen_offset = 1 + (screen - len(formatted_text))

        for pix in formatted_text:
            for offled in screens[screen_offset]:
                # reset des pixels du screen avant d'ecrire
                self.pixels[offled] = (0, 0, 0)

            for led in pix:
                self.pixels[screens[screen_offset][led]] = color
            screen_offset += 1

    def clear(self):
        self.pixels.fill((0, 0, 0))


if __name__ == '__main__':
    import os
    print("Extinction des leds")
    if os.getuid() != 0:
        exit("Les privilèges root sont necessaires !")
    Display(board.D18, 35).clear()


# pixels.fill((0,255,0))
# pixels[0] = (255, 255, 0)
