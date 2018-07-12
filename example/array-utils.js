export function isArrayEqual (left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) { return false }

  if (left.length !== right.length) { return false }

  return rightArrayIncludesOrEqualsLeftArray(isArrayEqual, left, right)
}

export function isChildOf (parentPath, path) {
  if (!Array.isArray(parentPath) || !Array.isArray(path)) { return false }

  if (parentPath.length >= path.length) { return false }

  return rightArrayIncludesOrEqualsLeftArray(isChildOf, parentPath, path)
}

function rightArrayIncludesOrEqualsLeftArray (recurse, left, right) {
  for (let i in left) {
    const leftV = left[i]
    const rightV = right[i]

    if (Array.isArray(leftV) && Array.isArray(rightV)) {
      if (recurse(leftV, rightV) === false) {
        return false
      }
    } else if (leftV !== rightV) {
      return false
    }
  }

  return true
}
